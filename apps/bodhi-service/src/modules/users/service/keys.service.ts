import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersKeys, UsersKeysQuota, UsersKeysState } from '../entity/keys.entity';

@Injectable()
export class UsersKeysService {
  constructor(
    @InjectRepository(UsersKeys)
    private readonly repository: Repository<UsersKeys>,
    @InjectRepository(UsersKeysQuota)
    private readonly quotas: Repository<UsersKeysQuota>,
  ) {}

  /**
   * Create a new secret key
   * @returns
   */
  async create(user_id: number, opts: Partial<UsersKeys>): Promise<UsersKeys> {
    const { foreign_user_id, note = '' } = opts;

    // check if foreign_user_id exists
    const exist = await this.repository.findOne({ where: { user_id, foreign_user_id } });
    if (exist) {
      return exist;
    }

    // create a new secret key
    const secret_key = `sk-` + uuidv4();
    return this.repository.save(this.repository.create({ user_id, foreign_user_id, secret_key, note }));
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
      this.repository.update(keys.id, { update_time: moment.utc().toDate() });
      return keys;
    }
    return null;
  }

  async getList(user_id: number): Promise<UsersKeys[]> {
    return this.repository.find({
      select: ['id', 'secret_key', 'foreign_user_id', 'note', 'expire_at', 'create_time'],
      where: { user_id },
    });
  }

  async delete(user_id: number, foreign_user_id: string) {
    return this.repository.update({ user_id, foreign_user_id }, { state: UsersKeysState.DELETED });
  }

  async update(user_id: number, foreign_user_id: string, opts: Partial<UsersKeys>) {
    const { note, expire_at } = opts;
    return this.repository.update({ user_id, foreign_user_id }, { note, expire_at });
  }

  async updateKeyLimit(user_id: number, opts: Partial<UsersKeysQuota>) {
    // check
  }
}
