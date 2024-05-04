import { Queue } from 'bull';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { Repository, In } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File, FileState } from './entity/file.entity';
import { FileDto } from './dto/upload.dto';
import { FileService } from './service';
import { InjectQueue } from '@nestjs/bull';

import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  private readonly storage: Storage;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    private readonly file: FileService,
    private readonly config: ConfigService,
  ) {
    const { client_email, private_key } = this.config.get('gcloud');
    this.storage = new Storage({ credentials: { client_email, private_key } });
  }

  async findActiveFilesByUserId(user_id: number, client_user_id?: string) {
    return this.file.findActiveByUserId(user_id, client_user_id);
  }

  async findActiveFilesById(id: number, user_id: number, client_user_id?: string) {
    return this.file.findActiveById(id, user_id, client_user_id);
  }

  // async update(id: number, opts: Partial<File>) {
  //   await this.repository.update(id, { ...opts });
  // }

  // async get(id: number): Promise<File> {
  //   return await this.repository.findOne({ where: { id } });
  // }

  // async findByIds(ids: number[]): Promise<File[]> {
  //   return await this.repository.find({ where: { id: In(ids) } });
  // }

  // async findFilesByIds(file_ids: string[]): Promise<File[]> {
  //   const ids = file_ids.map((id) => this.decodeId(id));
  //   return await this.repository.find({ where: { id: In(ids) } });
  // }

  async uploadFile(file: Express.Multer.File, opts: Partial<File>, purpose: string): Promise<FileDto> {
    const { hash, name, mimetype, size, user_id }: any = opts;
    const ext = mime.extension(mimetype as string);
    const path = `uploads/${moment.tz('Asia/Shanghai').format('YYYYMM')}/${uuidv4()}.${ext}`;
    Object.assign(opts, { path });

    // 检查是否已经上传
    let f = await this.file.findActiveByHash(hash);

    // 存在有效上传
    if (f) {
      const id = this.file.encodeId(f.id);
      const url = `https://s.alidraft.com${file.path}`;
      return { id, name, size, mimetype, hash, url, expires_at: f.expires_at };
    }

    // 初次上传
    f = await this.file.create({ ...opts, state: FileState.CREATED });
    if (f.state === FileState.CREATED) {
      const options = { destination: path };
      const res = await this.storage.bucket('bodhi-storage').file(path).save(file.buffer);
      console.log(`-> uploaded to bodhi-storage`, res);

      const id = this.file.encodeId(f.id);
      return { id, name, url: path, size, mimetype, hash, expires_at: f.expires_at } as FileDto;
      // const { res }: any = await putStream(f.path, file);
      // console.log(`[file]upload, oss`, res.status);
      // if (res.statusMessage === 'OK') {
      //   // 更新状态
      //   this.file.updateState(f.id, FileState.ACTIVE);
      //   const url = `https://s.alidraft.com${path}`;
      //   const id = this.file.encodeId(f.id);

      //   if (purpose === 'file-extract' && mimetype.includes('pdf')) {
      //     this.queue.add('extract', { id: f.id, mimetype, file });
      //   }

      //   return { id, name, url, size, mimetype, hash, expires_at: f.expires_at } as FileDto;
      // }

      // 上传异常
      // this.file.updateState(f.id, FileState.DELETED);
      // throw new Error(res.statusMessage);
    }

    throw new Error('file state error');
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
