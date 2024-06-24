import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BigNumber } from 'bignumber.js';
import * as moment from 'moment-timezone';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { UserKey, UserKeyState } from '../entity';

@Injectable()
export class UserKeyService {
  constructor(
    @InjectRepository(UserKey)
    private readonly repository: Repository<UserKey>,
  ) {}

  /**
   * Validate api key, when request by api key.
   * @param sk
   * @returns
   */
  async validateKey(sk: string): Promise<UserKey> {
    const query = { sk, state: UserKeyState.VALID };
    const keys = await this.repository.findOne({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
    if (keys) {
      // update last used time
      this.repository.update(keys.id, { update_at: moment.utc().toDate() });
      return keys;
    }
    return null;
  }

  async findOne(user_id: number, id: number): Promise<UserKey> {
    return this.repository.findOne({ where: { user_id, id, state: UserKeyState.VALID } });
  }

  /**
   * Create a new secret key
   * @returns
   */
  async createKey(user_id: number, opts: Partial<UserKey>): Promise<UserKey> {
    const { project_id, name } = opts;
    const exist = await this.repository.findOne({ where: { project_id, user_id, name, state: UserKeyState.VALID } });
    if (exist) {
      return exist;
    }

    // create a new secret key
    const sk = `sk-` + uuidv4();
    return this.repository.save(this.repository.create({ user_id, ...opts, sk }));
  }

  async updateCredits(user_id: number, sk: string, credits: number) {
    return this.repository.update({ user_id, sk }, { credits });
  }

  async consumeCredits(user_id: number, key_id: number, amount: number) {
    const price = new BigNumber(amount).toFixed(8);
    return this.repository.increment({ user_id, id: key_id }, 'consumed', price);
  }
}
