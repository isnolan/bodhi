import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Hashids from 'hashids';
import { IsNull, MoreThan, Repository } from 'typeorm';

import { File, FileState } from '../entity/file.entity';

@Injectable()
export class FileService {
  private readonly hashids: Hashids;

  constructor(
    @InjectRepository(File)
    private readonly repository: Repository<File>,
  ) {
    this.hashids = new Hashids('bodhi-files', 10);
  }

  encodeId(id: number) {
    return this.hashids.encode(id);
  }

  decodeId(id: string) {
    return this.hashids.decode(id)[0] as number;
  }

  async create(opts: Partial<File>) {
    return this.repository.save(this.repository.create(opts));
  }

  async delete(id: number, user_id: number, client_user_id?: string) {
    const query = { id, user_id };
    client_user_id && (query['client_user_id'] = client_user_id);

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

  async findActive(id: number, user_id: number, client_user_id?: string) {
    const query = { id, user_id, state: FileState.ACTIVE };
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
}
