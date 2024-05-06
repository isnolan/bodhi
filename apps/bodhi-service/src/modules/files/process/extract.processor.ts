import { Storage } from '@google-cloud/storage';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import path from 'path';

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

  @Process('file-extract')
  async extract(job: Job<ExtractQueueDto>) {
    const { id, mimeType, filePath } = job.data;
    console.log(`[files]extract`, id, filePath);

    try {
      const token = await this.auth.getAccessToken();
      const { bucket, processor } = this.config.get('gcloud');
      const res = await fetch(`${processor}:process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY as string),
        body: JSON.stringify({
          skipHumanReview: true,
          gcsDocument: { mimeType, gcsUri: `gs://${bucket}/${filePath}` },
        }),
      }).then((res) => res.json());
      // 存储原始JSON
      const folderUri = `${path.dirname(filePath)}/1.json`;
      await this.storage.bucket(bucket).file(folderUri).save(JSON.stringify(res));

      // 存储文本
      this.file.update(id, { extract: res?.document?.text });
    } catch (err) {
      console.warn(`[files]extract: error`, err);
    }
  }
}
