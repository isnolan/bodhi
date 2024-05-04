import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { createHash } from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as mime from 'mime-types';
import * as moment from 'moment-timezone';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

import { FileQuqueDto } from '../dto/queue.dto';
import { FileService } from '../service/file.service';

@Processor('bodhi')
export class DownloadProcessor {
  constructor(
    private readonly config: ConfigService,
    private readonly file: FileService,
  ) {}

  @Process('download')
  async expired(job: Job<FileQuqueDto>) {
    console.log(`[file]process`, job.data);
    const { id, url } = job.data;
    /* eslint no-async-promise-executor: */
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
          agent: new HttpsProxyAgent(this.config.get('proxy')),
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
        this.file.updateAttr(id, { hash, path, size, mimetype });

        // const { res }: any = await putStream(path, { buffer, size });
        // console.log(`[file]process`, res.statusMessage);
        // if (res.statusMessage === 'OK') {
        //   this.file.updateState(id, FileState.ACTIVE);
        //   resolve(res);
        // }
        // reject(res.statusMessage);
      } catch (err) {
        console.warn(`[file]process`, err.message);
        reject(err);
      }
    });
  }
}
