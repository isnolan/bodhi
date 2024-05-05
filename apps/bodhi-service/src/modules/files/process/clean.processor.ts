import { Storage } from '@google-cloud/storage';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job, Queue } from 'bull';
import path from 'path';

import { CleanQueueDto } from '../dto/queue.dto';
import { FileService } from '../service/file.service';

@Processor('bodhi')
export class CleanProcessor {
  private readonly storage: Storage;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    private readonly config: ConfigService,
    private readonly file: FileService,
  ) {
    this.storage = new Storage({ credentials: this.config.get('gcloud') });
  }

  /**
   * Auto clean expired files
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCleanExpired() {
    const files = await this.file.findExpired();
    for (const file of files) {
      this.queue.add('file-clean', { id: file.id });
    }
  }

  /**
   * Clean file from GCP Storage
   * @param job
   */
  @Process('file-clean')
  async clean(job: Job<CleanQueueDto>) {
    console.log(`[files]progress:clean`, job.data);
    const { id } = job.data;
    try {
      const file = await this.file.find(id);
      if (file && file.mimetype === 'application/pdf') {
        const { bucket } = this.config.get('gcloud');
        const prefix = path.dirname(file.path);
        this.storage.bucket(bucket).deleteFiles({ prefix, force: true });
      }
    } catch (err) {
      console.warn(`[file]progress:clean`, err.message);
    }
  }
}
