import { Storage } from '@google-cloud/storage';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import * as mime from 'mime-types';
import * as moment from 'moment-timezone';

import { FileDto } from './dto/upload.dto';
import { File, FileState } from './entity/file.entity';
import { FileService } from './service';

@Injectable()
export class FilesService {
  private readonly storage: Storage;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    private readonly file: FileService,
    private readonly config: ConfigService,
  ) {
    this.storage = new Storage({ credentials: this.config.get('gcloud') });
  }

  async findActiveFilesByUserId(user_id: number, client_user_id?: string) {
    return this.file.findActiveByUserId(user_id, client_user_id);
  }

  async findActiveById(id: number, user_id: number, client_user_id?: string) {
    return this.file.findActive(id, user_id, client_user_id);
  }

  async delete(id: number, user_id: number, client_user_id?: string) {
    this.queue.add('clean', { id, user_id });
    return this.file.delete(id, user_id, client_user_id);
  }

  async uploadFile(file: Express.Multer.File, opts: Partial<File>, purpose: string): Promise<FileDto> {
    const { hash, name, mimetype, size } = opts;
    // 检查是否已经上传
    let f = await this.file.findActiveByHash(hash);
    if (f) {
      const id = this.file.encodeId(f.id);
      const url = `https://s.alidraft.com${f.path}`;
      return { id, name, size, mimetype, url, expires_at: f.expires_at };
    }

    // 初次上传
    f = await this.file.create({ ...opts, state: FileState.CREATED });

    try {
      const ext = mime.extension(mimetype as string);
      const folderPath = `uploads/${moment.tz('Asia/Shanghai').format('YYYYMM')}/${hash}`;
      const filePath = `${folderPath}/0.${ext}`;

      const { bucket } = this.config.get('gcloud');
      await this.storage.bucket(bucket).file(filePath).save(file.buffer);

      // file extract
      if (mimetype.includes('pdf') && purpose === 'file-extract') {
        this.queue.add('extract', { id: f.id, mimetype, folderPath, filePath });
      }

      // 更新文件
      this.file.update(f.id, { path: filePath, state: FileState.ACTIVE });

      const id = this.file.encodeId(f.id);
      const url = `https://s.alidraft.com/${filePath}`;
      return { id, name, url, size, mimetype, expires_at: f.expires_at } as FileDto;
    } catch (err) {
      console.warn(err);

      this.file.updateState(f.id, FileState.DELETED);
      throw err;
    }
  }

  /**
   * 执行下载，第一时间返回
   * @param file_id
   * @param name
   * @param file_url
   * @returns
   */
  async uploadByURL(file_id: string, name: string, url: string) {
    // check file_id is exists
    let file = await this.file.findActiveByFileID(file_id);
    console.log(`[file]exists`, file_id, file);

    if (file) {
      return { id: file.id, name, url: `https://s.alidraft.com${file.path}` };
    }

    // 新建下载任务
    file = await this.file.create({ file_id, name });
    this.queue.add('download', { id: file.id, file_id, name, url });

    return { id: file.id, name, url };
  }
}
