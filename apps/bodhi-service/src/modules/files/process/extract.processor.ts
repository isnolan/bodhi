import { Job } from 'bull';
import fetch from 'node-fetch';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createHash } from 'crypto';
import * as moment from 'moment-timezone';
import { Process, Processor } from '@nestjs/bull';

import { ExtractQueueDto, FileQuqueDto } from '../dto/queue.dto';
import { FilesService } from '../files.service';
import { ConfigService } from '@nestjs/config';
import { FileService } from '../service/file.service';
import { FileState } from '../entity/file.entity';

@Processor('bodhi')
export class ExtractProcessor {
  constructor(private readonly config: ConfigService, private readonly file: FileService) {}

  @Process('extract')
  async extract(job: Job<ExtractQueueDto>) {
    console.log(`[file]extract`, job.data);
    const { id, mimetype: mimeType, file: content } = job.data;

    const { processor, client_email, private_key } = this.config.get('gcloud');
    const auth: GoogleAuth = new GoogleAuth({
      credentials: { client_email, private_key },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });

    const res = await fetch(`${processor}:process`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.getAccessToken()}` },
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
