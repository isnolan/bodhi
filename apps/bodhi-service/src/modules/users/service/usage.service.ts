import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, MoreThan, Repository } from 'typeorm';

import { KeyUsageState, UserKeyUsage } from '../entity';

@Injectable()
export class UserKeyUsageService {
  constructor(
    @InjectRepository(UserKeyUsage)
    private readonly repository: Repository<UserKeyUsage>,
  ) {}

  /**
   * Check if the key has available quota.
   * @param key_id
   * @param model
   * @returns
   */
  async checkAvailable(client_user_id: string, model: string): Promise<number> {
    const query = { client_user_id, models: Like(`%\"${model}\"%`), state: KeyUsageState.VALID };
    const row = await this.repository.findOne({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
    if (!row) {
      return -1;
    }

    if (
      (row.times_limit == -1 || row.times_limit >= row.times_consumed) &&
      (row.tokens_limit == -1 || row.tokens_limit >= row.tokens_consumed)
    ) {
      return row.id;
    }

    return 0;
  }

  async consume(usage_id: number, times: number = 0, tokens: number = 0) {
    if (times > 0) {
      await this.repository.increment({ id: usage_id }, 'times_consumed', times);
    }
    if (tokens > 0) {
      await this.repository.increment({ id: usage_id }, 'tokens_consumed', tokens);
    }
  }

  async allocate(user_id: number, opts: Partial<UserKeyUsage>): Promise<UserKeyUsage> {
    const { client_user_id, client_usage_id, times_limit = -1, tokens_limit = -1 } = opts;
    const where = { user_id, client_user_id, client_usage_id, state: KeyUsageState.VALID };
    const usage = await this.repository.findOne({ where });

    if (usage) {
      const d = {};
      times_limit > 0 && Object.assign(d, { times_limit: usage.times_limit + times_limit });
      tokens_limit > 0 && Object.assign(d, { tokens_limit: usage.tokens_limit + tokens_limit });
      await this.repository.update(usage.id, d);
      return usage;
    } else {
      return this.repository.save(this.repository.create({ user_id, client_user_id, ...opts }));
    }
  }
}
