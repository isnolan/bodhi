import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, MoreThan, Repository } from 'typeorm';

import { KeyUsageState, UserUsage } from '../entity';

@Injectable()
export class UserUsageService {
  constructor(
    @InjectRepository(UserUsage)
    private readonly repository: Repository<UserUsage>,
  ) {}

  /**
   * Check if the key has available quota.
   * @param key_id
   * @param model
   * @returns
   */
  async checkAvailable(client_user_id: string, model: string): Promise<number> {
    const query = { client_user_id, models: Like(`%"${model}"%`), state: KeyUsageState.VALID };
    const row = await this.repository.findOne({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
    if (!row) {
      return -1;
    }

    if (row.credit_balance == -1 || row.credit_balance >= row.credit_consumed) {
      return row.id;
    }

    return 0;
  }

  async consume(usage_id: number, credits: number = 0) {
    if (credits > 0) {
      await this.repository.increment({ id: usage_id }, 'credit_consumed', credits);
    }
  }

  async allocate(user_id: number, opts: Partial<UserUsage>): Promise<UserUsage> {
    const { client_user_id, client_usage_id, credit_balance = -1 } = opts;
    const where = { user_id, client_user_id, client_usage_id, state: KeyUsageState.VALID };
    const usage = await this.repository.findOne({ where });

    if (usage) {
      const d = {};
      credit_balance > 0 && Object.assign(d, { credit_balance: usage.credit_balance + credit_balance });
      await this.repository.update(usage.id, d);
      return usage;
    } else {
      return this.repository.save(this.repository.create({ user_id, client_user_id, ...opts }));
    }
  }

  async findById(usage_id: number): Promise<UserUsage> {
    return this.repository.findOne({ where: { id: usage_id } });
  }
}
