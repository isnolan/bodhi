import { Job } from 'bull';
import fetch from 'node-fetch';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import * as moment from 'moment-timezone';
import { Process, Processor } from '@nestjs/bull';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { FileQuqueDto } from '../dto/queue-file.dto';
import { FilesService } from '../files.service';
import { ConfigService } from '@nestjs/config';
import { putStream } from '@/core/utils/aliyun';
import { FileService } from './file.service';
import { FileState } from '../entity/file.entity';

@Processor('bodhi')
export class ExtractProcessor {
  constructor(private readonly config: ConfigService, private readonly file: FileService) {}

  @Process('extract')
  async expired(job: Job<FileQuqueDto>) {
    console.log(`[file]process`, job.data);
    const { id, url } = job.data;
    return new Promise(async (resolve, reject) => {
      try {
      } catch (err) {
        console.warn(`[file]process`, err.message);
        reject(err);
      }
    });
  }
}
