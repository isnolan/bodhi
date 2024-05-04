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

  constructor(
    private readonly config: ConfigService,
    private readonly file: FileService,
  ) {
    this.auth = new GoogleAuth({
      credentials: config.get('gcloud'),
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
  }

  @Process('extract')
  async extract(job: Job<ExtractQueueDto>) {
    const { id, mimetype: mimeType, file: content } = job.data;
    console.log(`[file]extract`, id, job.data);

    const { processor } = this.config.get('gcloud');
    const token = await this.auth.getAccessToken();
    const res = await fetch(`${processor}:process`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      agent: new HttpsProxyAgent(process.env.HTTP_PROXY as string),
      body: JSON.stringify({
        skipHumanReview: true,
        // gcsDocument: { mimeType: 'application/pdf', gcsUri: 'gs://bodhi-storage/IMG_0174.pdf' },
        rawDocument: { mimeType, content },
      }),
      method: 'POST',
    }).then((res) => res.json());
    console.log(`->res`, res);
  }
}
