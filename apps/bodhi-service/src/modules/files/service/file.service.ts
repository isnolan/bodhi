import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import { In, IsNull, LessThan, MoreThan, Repository } from 'typeorm';

import { File, FileState } from '../entity/file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly repository: Repository<File>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpired() {
    const expires_at = moment.utc().toDate();
    const files = await this.repository.find({ where: { expires_at: LessThan(expires_at), state: FileState.ACTIVE } });
    for (const file of files) {
      this.repository.update(file.id, { state: FileState.EXPIRED });
    }
  }

  async findExpired7Days() {
    const expires_at = moment.utc().add(7, 'days').toDate();
    return this.repository.find({ where: { expires_at: LessThan(expires_at), state: FileState.EXPIRED } });
  }

  async create(opts: Partial<File>) {
    return this.repository.save(this.repository.create(opts));
  }

  async delete(id: number) {
    return this.repository.update({ id }, { state: FileState.DELETED });
  }

  async find(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async findActiveByUserId(user_id: number, client_user_id?: string): Promise<File[]> {
    const query = { user_id, state: FileState.ACTIVE };
    client_user_id && (query['client_user_id'] = client_user_id);
    return this.repository.find({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'expires_at', 'state'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
  }

  async findActiveById(id: number, user_id?: number, client_user_id?: string) {
    const query = { id };
    user_id && (query['user_id'] = user_id);
    client_user_id && (query['client_user_id'] = client_user_id);

    return this.repository.findOne({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'expires_at', 'state'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
  }

  async findExtractByIds(ids: number[]) {
    return this.repository.find({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'extract', 'state'],
      where: [{ id: In(ids) }],
    });
  }

  async findActiveByHash(hash: string) {
    const query = { hash, state: FileState.ACTIVE };
    return this.repository.findOne({
      select: ['id', 'name', 'path', 'size', 'mimetype', 'hash', 'expires_at', 'state'],
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
}
