import { Storage } from '@google-cloud/storage';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import path from 'path';

import { ExtractQueueDto } from '../dto/queue.dto';
import { FileState } from '../entity/file.entity';
import { FileService } from '../service/file.service';

@Processor('bodhi')
export class ExtractProcessor {
  private readonly auth: GoogleAuth;
  private readonly storage: Storage;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    private readonly file: FileService,
    private readonly config: ConfigService,
  ) {
    const credentials = this.config.get('gcloud');
    this.auth = new GoogleAuth({ credentials, scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    this.storage = new Storage({ credentials });
  }

  @Process('file-extract')
  async fileExtractSync(job: Job<ExtractQueueDto>) {
    const { id, mimeType, filePath, totalPages } = job.data;
    console.log(`[files]extract`, id, filePath);

    try {
      // application/pdf
      const time1 = Date.now();
      const { bucket } = this.config.get('gcloud');
      const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
      const pageGroups = [];
      for (let i = 0; i < totalPages; i += 15) {
        pageGroups.push(allPages.slice(i, i + 15));
      }

      const extracts = await Promise.all(
        pageGroups.map(async (pages, idx) => {
          const extract = await this.extractText(filePath, mimeType, pages);
          const folderUri = `${path.dirname(filePath)}/${idx}.json`;
          this.storage.bucket(bucket).file(folderUri).save(JSON.stringify(extract));
          if (extract.error) {
            return '';
          }
          return extract.document.text;
        }),
      );

      this.file.update(id, { extract: extracts.join(''), state: FileState.ACTIVE });
      console.log(`[files]tooks`, Date.now() - time1, 'ms');
    } catch (err) {
      console.warn(err);
    }
  }

  async extractText(filePath: string, mimeType: string, pages: number[]) {
    const token = await this.auth.getAccessToken();
    const { bucket, processor } = this.config.get('gcloud');
    return await fetch(`${processor}:process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      agent: process.env.HTTP_PROXY ? new HttpsProxyAgent(process.env.HTTP_PROXY as string) : undefined,
      body: JSON.stringify({
        skipHumanReview: true,
        gcsDocument: { mimeType, gcsUri: `gs://${bucket}/${filePath}` },
        fieldMask: 'text',
        processOptions: { individualPageSelector: { pages } },
      }),
    }).then((res) => res.json());
  }

  // @Process('file-extract-async')
  // async fileExtractAsync(job: Job<ExtractQueueDto>) {
  //   const { id, mimeType, filePath } = job.data;
  //   console.log(`[files]extract`, id, filePath);

  //   try {
  //     const token = await this.auth.getAccessToken();
  //     const { bucket, processor } = this.config.get('gcloud');
  //     const res = await fetch(`${processor}:batchProcess`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //       agent: process.env.HTTP_PROXY ? new HttpsProxyAgent(process.env.HTTP_PROXY as string) : undefined,
  //       body: JSON.stringify({
  //         skipHumanReview: true,
  //         inputDocuments: {
  //           gcsDocuments: {
  //             documents: [{ gcsUri: `gs://${bucket}/${filePath}`, mimeType: mimeType }],
  //           },
  //         },
  //         documentOutputConfig: {
  //           gcsOutputConfig: {
  //             gcsUri: `gs://${bucket}/${path.dirname(filePath)}`,
  //             fieldMask: 'text',
  //             shardingConfig: { pagesPerShard: 100 },
  //           },
  //         },
  //       }),
  //     }).then((res) => res.json());

  //     console.log(`[files]extract2`, res);

  //     this.queue.add(
  //       'file-extract-state',
  //       { name: res.name },
  //       {
  //         delay: 2000, // 每次尝试之间的延迟为1秒
  //         attempts: 1000, // 最大尝试次数
  //         backoff: 2000, // 每次失败后的额外延迟为2秒
  //         removeOnComplete: true, // 任务成功后从队列中移除
  //       },
  //     );

  //     // 存储文本
  //     // this.file.update(id, { extract: res?.document?.text, state: FileState.ACTIVE });
  //   } catch (err) {
  //     console.warn(`[files]extract: error`, err);
  //   }
  // }

  // @Process('file-extract-state')
  // async fetchExtractState(job: Job<StateQueueDto>) {
  //   const { name } = job.data;
  //   console.log(`[files]extract:state`, name);

  //   /* eslint no-async-promise-executor: */
  //   return new Promise(async (resolve, reject) => {
  //     const token = await this.auth.getAccessToken();
  //     const res = await fetch(`https://us-documentai.googleapis.com/v1/${name}`, {
  //       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //       agent: process.env.HTTP_PROXY ? new HttpsProxyAgent(process.env.HTTP_PROXY as string) : undefined,
  //     }).then((res) => res.json());
  //     console.log(`[files]extract3`, JSON.stringify(res, null, 2));

  //     // {
  //     //   "name": "projects/844941471694/locations/us/operations/2152814927834822415",
  //     //   "metadata": {
  //     //     "@type": "type.googleapis.com/google.cloud.documentai.v1.BatchProcessMetadata",
  //     //     "state": "SUCCEEDED",
  //     //     "createTime": "2024-05-15T16:08:50.286290Z",
  //     //     "updateTime": "2024-05-15T16:10:13.719162Z",
  //     //     "individualProcessStatuses": [
  //     //       {
  //     //         "inputGcsSource": "gs://bodhi-storage/uploads/202405/678add27ba9037fb5afc1484b05db57c/0.pdf",
  //     //         "status": {},
  //     //         "outputGcsDestination": "gs://bodhi-storage/uploads/202405/678add27ba9037fb5afc1484b05db57c/2152814927834822415/0",
  //     //         "humanReviewStatus": {
  //     //           "state": "SKIPPED"
  //     //         }
  //     //       }
  //     //     ]
  //     //   },
  //     //   "done": true,
  //     //   "response": {
  //     //     "@type": "type.googleapis.com/google.cloud.documentai.v1.BatchProcessResponse"
  //     //   }
  //     // }

  //     if (res.metadata.state === 'SUCCEEDED') {
  //       // 获取文本
  //       // const { bucket } = this.config.get('gcloud');
  //       // const folderUri = `${path.dirname(res.metadata.individualProcessStatuses[0].outputGcsDestination)}/0-0.json`;
  //       // const text = await this.storage
  //       //   .bucket(bucket)
  //       //   .file(folderUri)
  //       //   .download()
  //       //   .then((res) => res[0].toString());
  //       //
  //       // 存储原始JSON
  //       // const folderUri = `${path.dirname(filePath)}/1.json`;
  //       // await this.storage.bucket(bucket).file(folderUri).save(JSON.stringify(res));

  //       // 存储文本
  //       // this.file.update(id, { extract: res?.document?.text, state: FileState.ACTIVE });

  //       resolve({});
  //     }

  //     if (res.metadata.state === 'RUNNING') {
  //       reject();
  //     }
  //   });
  // }
}
