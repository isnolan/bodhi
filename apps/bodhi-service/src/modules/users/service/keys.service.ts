import { v4 as uuidv4 } from 'uuid';
import { IsNull, MoreThan, Repository } from 'typeorm';
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

  async validateKey(secret_key: string): Promise<UsersKeys> {
    const query = { secret_key, state: UsersKeysState.VALID };
    const keys = await this.repository.findOne({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
    if (keys) {
      // update last used time
      this.repository.update(keys.id, { update_time: moment.utc().toDate() });
      return keys;
    }
    return null;
  }

  async findKey(user_id: number, foreign_user_id: string): Promise<UsersKeys> {
    return this.repository.findOne({ where: { user_id, foreign_user_id } });
  }

  /**
   * Create a new secret key
   * @returns
   */
  async createKey(user_id: number, opts: Partial<UsersKeys>): Promise<UsersKeys> {
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

  async getList(user_id: number): Promise<UsersKeys[]> {
    return this.repository.find({
      select: ['id', 'secret_key', 'foreign_user_id', 'note', 'expires_at', 'create_time'],
      where: { user_id },
    });
  }

  async deleteKey(id: number) {
    return this.repository.update(id, { state: UsersKeysState.DELETED });
  }

  async updateKeyLimit(user_id: number, foreign_user_id: string, opts: Partial<UsersKeysQuota>) {
    // check
    const key = await this.repository.findOne({ where: { user_id, foreign_user_id } });
    if (!key) {
      throw new Error(`key not found`);
    }
    const { model, times_limit, tokens_limit, expires_at } = opts;
    const quota = await this.quotas.findOne({ where: { key_id: key.id, model, state: 1 } });
    if (quota) {
      return this.quotas.update(quota.id, { times_limit, tokens_limit, expires_at });
    } else {
      return this.quotas.save(this.quotas.create({ key_id: key.id, ...opts }));
    }
  }
}
