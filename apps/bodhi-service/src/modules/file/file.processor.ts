import { Job } from 'bull';
import fetch from 'node-fetch';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Process, Processor } from '@nestjs/bull';

import { FileService } from './file.service';
import { FileQuqueDto } from './dto/queue-file.dto';
import { FileState } from './entity/file.entity';
import { putStream } from '@/common/utils/aliyun';

@Processor('chatbot')
export class FileProcessor {
  private readonly proxy: any;

  constructor(private readonly config: ConfigService, private readonly service: FileService) {
    this.proxy = config.get('proxy');
  }

  /**
   * File download process
   */
  @Process('download')
  async openai(job: Job<FileQuqueDto>) {
    console.log(`[file]process`, job.data);
    const { id, url } = job.data;
    return new Promise(async (resolve, reject) => {
      try {
        // download & upload
        const { buffer, mimetype, size } = await fetch(url, {
          headers: {
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'sec-ch-ua-platform': '"macOS"',
          },
          agent: new HttpsProxyAgent(this.proxy),
        }).then((res) => {
          const mimetype = res.headers.get('Content-Type') as string;
          return res.buffer().then((buffer) => ({ buffer, mimetype, size: buffer.length }));
        });
        console.log(`[file]process`, mimetype, size, url);

        // Upload to oss
        const hashhex = createHash('md5');
        hashhex.update(buffer);
        const hash = hashhex.digest('hex');
        const ext = mime.extension(mimetype);
        const path = `/attachments/${moment.tz('Asia/Shanghai').format('YYYYMM')}/${uuidv4()}.${ext}`;
        this.service.update(id, { hash, path, size, mimetype });

        const { res }: any = await putStream(path, { buffer, size });
        console.log(`[file]process`, res.statusMessage);
        if (res.statusMessage === 'OK') {
          const opts = { state: FileState.UPLOADED };
          this.service.update(id, opts);
          resolve(res);
        }
        reject(res.statusMessage);
      } catch (err) {
        console.warn(`[file]process`, err.message);
        reject(err);
      }
    });
  }
}
