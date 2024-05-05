import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';

import { File, FileState } from '../entity/file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly repository: Repository<File>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpired() {
    const files = await this.repository.find({ where: { expires_at: MoreThan(new Date()), state: FileState.ACTIVE } });
    for (const file of files) {
      this.repository.update(file.id, { state: FileState.EXPIRED });
    }
  }

  async create(opts: Partial<File>) {
    return this.repository.save(this.repository.create(opts));
  }

  async delete(id: number, user_id: number) {
    const query = { id, user_id };
    return this.repository.update(query, { state: FileState.DELETED });
  }

  async findActiveByUserId(user_id: number, client_user_id?: string) {
    const query = { user_id, state: FileState.ACTIVE };
    client_user_id && (query['client_user_id'] = client_user_id);

    return this.repository.find({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'hash', 'expires_at'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
  }

  async find(id: number, user_id?: number, client_user_id?: string) {
    const query = { id };
    user_id && (query['user_id'] = user_id);
    client_user_id && (query['client_user_id'] = client_user_id);

    return this.repository.findOne({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'hash', 'expires_at', 'state'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
  }

  async findActiveByHash(hash: string) {
    const query = { hash, state: FileState.ACTIVE };
    return this.repository.findOne({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'hash', 'expires_at'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
  }

  async updateState(id: number, state: FileState) {
    return this.repository.update(id, { state });
  }

  async update(id: number, opts: Partial<File>) {
    return this.repository.update(id, { ...opts });
  }

  async findActiveByFileID(file_id: string) {
    return this.repository.findOne({ where: { file_id, state: FileState.ACTIVE } });
  }

  async findExpired() {
    return this.repository.find({ where: { state: FileState.EXPIRED } });
  }
}
