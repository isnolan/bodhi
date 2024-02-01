import Redis from 'ioredis';
import Hashids from 'hashids/cjs';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { Repository, In } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { File, FileState } from './entity/file.entity';
import { putStream } from '@/core/utils/aliyun';
import { FileDto, FileListDto } from './dto/upload.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FilePuppetDto } from './dto/queue-file.dto';
@Injectable()
export class FilesService {
  private readonly hashids: Hashids;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    @InjectRedis()
    private readonly redis: Redis,
    @InjectRepository(File)
    private readonly repository: Repository<File>,
  ) {
    this.hashids = new Hashids('file', 10);
  }

  encodeId(id: number): string {
    return this.hashids.encode(id);
  }

  decodeId(id: string): number {
    return this.hashids.decode(id)[0] as number;
  }

  async update(id: number, opts: Partial<File>) {
    await this.repository.update(id, { ...opts });
  }

  async get(id: number): Promise<File> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<File[]> {
    return await this.repository.find({ where: { id: In(ids) } });
  }

  async findFilesByIds(file_ids: string[]): Promise<File[]> {
    const ids = file_ids.map((id) => this.decodeId(id));
    return await this.repository.find({ where: { id: In(ids) } });
  }

  async uploadFile(upload: any, opts: Partial<File>, model?: string): Promise<FileListDto> {
    const { hash, name, mimetype, size }: any = opts;
    const ext = mime.extension(mimetype as string);
    const path = `/attachments/${moment.tz('Asia/Shanghai').format('YYYYMM')}/${uuidv4()}.${ext}`;
    Object.assign(opts, { path });

    // 检查是否已经上传
    let file = await this.repository.findOne({ where: { hash }, order: { id: 'DESC' } });
    console.log(`[file]hash`, hash, file?.id);
    // 存在有效上传
    if (file && [FileState.UPLOADED, FileState.PROCESSED].includes(file.state)) {
      const url = `https://s.alidraft.com${file.path}`;

      // TODO: 检查并推送文件到对应模型
      if (model) {
        const s1: FilePuppetDto = { model, id: file.id, url };
        await this.redis.publish('attachment', JSON.stringify(s1));
      }
      return { id: this.encodeId(file.id), name, url, size, mimetype, hash } as FileListDto;
    }

    // 初次上传
    file = await this.repository.save(this.repository.create({ ...opts, state: FileState.CREATED }));
    console.log(`[file]upload, `, file.id);
    if (file.state === FileState.CREATED) {
      const { res }: any = await putStream(file.path, upload);
      console.log(`[file]upload, oss`, res.status);
      if (res.statusMessage === 'OK') {
        // 更新状态
        this.update(file.id, { state: FileState.UPLOADED });
        const url = `https://s.alidraft.com${path}`;

        // TODO: 检查并推送文件到对应模型
        if (model) {
          const s2: FilePuppetDto = { model, id: file.id, url };
          await this.redis.publish('attachment', JSON.stringify(s2));
        }
        return { id: this.encodeId(file.id), name, url, size, mimetype, hash } as FileListDto;
      }

      // 上传异常
      this.update(file.id, { state: FileState.DELETED });
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
  async uploadByURL(file_id: string, name: string, url: string): Promise<FileDto> {
    // check file_id is exists
    let file = await this.repository.findOne({ where: { file_id }, order: { id: 'DESC' } });
    console.log(`[file]exists`, file_id, file);
    if (file) {
      return { id: this.encodeId(file.id), name, url: `https://s.alidraft.com${file.path}` };
    }
    // 新建下载任务
    const opts = { file_id, name };
    file = await this.repository.save(this.repository.create({ ...opts, state: FileState.CREATED }));

    // 异步下载任务
    const { id } = await this.queue.add('download', { id: file.id, file_id, name, url });
    console.log(`[file]queue`, id);

    return { id: this.encodeId(file.id), name, url };
  }
}
