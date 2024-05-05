import { Storage } from '@google-cloud/storage';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

import { ExtractQueueDto } from '../dto/queue.dto';
import { FileService } from '../service/file.service';

@Processor('bodhi')
export class ExtractProcessor {
  private readonly auth: GoogleAuth;
  private readonly storage: Storage;

  constructor(
    private readonly config: ConfigService,
    private readonly file: FileService,
  ) {
    this.auth = new GoogleAuth({
      credentials: this.config.get('gcloud'),
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    this.storage = new Storage({ credentials: this.config.get('gcloud') });
  }

  @Process('extract')
  async extract(job: Job<ExtractQueueDto>) {
    const { id, folderPath, filePath } = job.data;
    console.log(`[file]extract`, id, job.data);

    const { bucket, processor } = this.config.get('gcloud');
    const token = await this.auth.getAccessToken();
    const res = await fetch(`${processor}:process`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      agent: new HttpsProxyAgent(process.env.HTTP_PROXY as string),
      body: JSON.stringify({
        skipHumanReview: true,
        gcsDocument: { mimeType: 'application/pdf', gcsUri: `gs://${bucket}/${filePath}` },
        // inputDocuments: {
        //   gcsDocuments: {
        //     documents: [{ mimeType: 'application/pdf', gcsUri: `gs://${bucket}/${path}` }],
        //   },
        // },
        // documentOutputConfig: {
        //   gcsOutputConfig: { gcsUri: `gs://${bucket}/extract/` },
        // },
      }),
      method: 'POST',
    }).then((res) => res.json());

    // 存储原始JSON
    await this.storage
      .bucket(bucket)
      .file(`${folderPath}/1.json`)
      .save(JSON.stringify(res, null, 2));

    // 存储文本
    this.file.update(id, { extract: res?.document?.text });

    // {
    //   name: 'projects/844941471694/locations/us/operations/15081559040310862204',
    //   metadata: {
    //     '@type': 'type.googleapis.com/google.cloud.documentai.v1.BatchProcessMetadata',
    //     state: 'RUNNING',
    //     createTime: '2024-05-04T15:04:57.750101Z',
    //     updateTime: '2024-05-04T15:04:57.750101Z'
    //   }
    // }

    console.log(`->res`, res);
    // 更新状态
  }
}
