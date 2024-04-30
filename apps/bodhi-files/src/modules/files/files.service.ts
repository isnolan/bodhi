import { Queue } from 'bull';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { Repository, In } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File, FileState } from './entity/file.entity';
import { putStream } from '@/core/utils/aliyun';
import { FileDto } from './dto/upload.dto';
import { FileService } from './service';
import { InjectQueue } from '@nestjs/bull';
@Injectable()
export class FilesService {
  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    private readonly file: FileService,
  ) {}

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

  async uploadFile(upload: any, opts: Partial<File>, purpose: string): Promise<FileDto> {
    const { hash, name, mimetype, size, user_id }: any = opts;
    const ext = mime.extension(mimetype as string);
    const path = `/attachments/${moment.tz('Asia/Shanghai').format('YYYYMM')}/${uuidv4()}.${ext}`;
    Object.assign(opts, { path });

    // 检查是否已经上传
    let file = await this.file.findActiveByHash(hash);

    // 存在有效上传
    if (file) {
      const id = this.file.encodeId(file.id);
      const url = `https://s.alidraft.com${file.path}`;
      return { id, name, size, mimetype, hash, url, expires_at: file.expires_at };
    }

    // 初次上传
    file = await this.file.create({ ...opts, state: FileState.CREATED });
    if (file.state === FileState.CREATED) {
      const { res }: any = await putStream(file.path, upload);
      console.log(`[file]upload, oss`, res.status);
      if (res.statusMessage === 'OK') {
        // 更新状态
        this.file.updateState(file.id, FileState.ACTIVE);
        const url = `https://s.alidraft.com${path}`;
        const id = this.file.encodeId(file.id);

        return { id, name, url, size, mimetype, hash, expires_at: file.expires_at } as FileDto;
      }

      // 上传异常
      this.file.updateState(file.id, FileState.DELETED);
      throw new Error(res.statusMessage);
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
