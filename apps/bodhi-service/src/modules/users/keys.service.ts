import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersKeys, UsersKeysState } from './entity/keys.entity';

@Injectable()
export class UsersKeysService {
  constructor(
    @InjectRepository(UsersKeys)
    private readonly repository: Repository<UsersKeys>,
  ) {}

  /**
   * Create a new secret key
   * @returns
   */
  async create(user_id: number, opts: Partial<UsersKeys>): Promise<UsersKeys> {
    const { foreign_id = '', note = '' } = opts;
    const secret_key = `sk-` + uuidv4();
    const model = this.repository.create({ user_id, secret_key, foreign_id, note });
    return await this.repository.save(model);
  }

  /**
   * Find a secret key
   * @param secret_key
   * @returns
   */
  async validateKey(secret_key: string): Promise<UsersKeys> {
    const keys = await this.repository.findOne({ where: { secret_key, state: UsersKeysState.VALID } });
    if (keys && (!keys.expire_at || keys.expire_at > new Date())) {
      // update last used time
      await this.repository.update(keys.id, { update_time: moment.utc() });
      return keys;
    }
    return null;
  }

  async getList(user_id: number): Promise<UsersKeys[]> {
    return await this.repository.find({
      select: ['id', 'secret_key', 'quota', 'foreign_id', 'note', 'expire_at', 'create_time'],
      where: { user_id },
    });
  }

  async delete(user_id: number, foreign_id: string) {
    return await this.repository.update({ user_id, foreign_id }, { state: UsersKeysState.DELETED });
  }

  async update(user_id: number, foreign_id: string, opts: Partial<UsersKeys>) {
    const { quota, note, expire_at } = opts;
    return await this.repository.update({ user_id, foreign_id }, { quota, note, expire_at });
  }
}
