import { Storage } from '@google-cloud/storage';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { GoogleAuth } from 'google-auth-library';

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

    const { id, path } = job.data;
    try {
      await this.storage.bucket('bodhi-storage').file(path).delete();
    } catch (err) {
      console.warn(`[file]progress:clean`, id, err);
    }
  }
}
