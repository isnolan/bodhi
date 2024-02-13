import { v4 as uuidv4 } from 'uuid';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { KeyUsageState, UserKeyState, UserKeyUsage } from '../entity';

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
  async checkAvailableQuota(key_id: number, model: string): Promise<number> {
    const query = { key_id, model, state: KeyUsageState.VALID };
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
      (row.times_limit === -1 || row.times_limit >= row.times_consumed) &&
      (row.tokens_limit === -1 || row.tokens_limit >= row.tokens_consumed)
    ) {
      return row.id;
    }

    return 0;
  }

  /**
   * Consumes key quote, after a message has been sent.
   * @param id
   * @param times
   * @param tokens
   */
  async consumeKeyQuote(id: number, times: number = 0, tokens: number = 0) {
    if (times > 0) {
      await this.repository.increment({ id }, 'times_consumed', times);
    }
    if (tokens > 0) {
      await this.repository.increment({ id }, 'tokens_consumed', tokens);
    }
  }

  async increaseQuota(key_id, opts: Partial<UserKeyUsage>): Promise<UserKeyUsage> {
    const { client_usage_id, times_limit = -1, tokens_limit = -1 } = opts;
    const usage = await this.repository.findOne({
      where: { key_id, client_usage_id, state: 1 },
      order: { id: 'DESC' },
    });

    if (usage) {
      const d = {};
      times_limit > 0 && Object.assign(d, { times_limit: usage.times_limit + times_limit });
      tokens_limit > 0 && Object.assign(d, { tokens_limit: usage.tokens_limit + tokens_limit });
      await this.repository.update(usage.id, d);
      return usage;
    } else {
      return this.repository.save(this.repository.create({ key_id, ...opts }));
    }
  }
}
