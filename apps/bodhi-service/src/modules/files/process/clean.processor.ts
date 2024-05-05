import { Storage } from '@google-cloud/storage';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

import { CleanQueueDto } from '../dto/queue.dto';
import { FileService } from '../service/file.service';

@Processor('bodhi')
export class CleanProcessor {
  private readonly storage: Storage;
  private readonly auth: GoogleAuth;

  constructor(
    private readonly config: ConfigService,
    private readonly file: FileService,
  ) {
    this.storage = new Storage({ credentials: this.config.get('gcloud') });
  }

  @Process('clean')
  async clean(job: Job<CleanQueueDto>) {
    console.log(`[file]progress:clean`, job.data);
    const { id, user_id } = job.data;
    const file = await this.file.findActive(id, user_id);
    try {
      if (file.mimetype === 'application/pdf') {
        const { bucket } = this.config.get('gcloud');
        const prefix = path.dirname(file.path);
        this.storage.bucket(bucket).deleteFiles({ prefix, force: true });
        console.log(`->deleted`, prefix);
      }
    } catch (err) {
      console.warn(`[file]progress:clean`, err.message);
    }
  }
}
