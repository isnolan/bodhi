import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatUsage } from '../entity';

@Injectable()
export class ChatUsageService {
  constructor(
    @InjectRepository(ChatUsage)
    private readonly repository: Repository<ChatUsage>,
  ) {}

  async save(user_id, opts: Partial<ChatUsage>): Promise<ChatUsage> {
    return this.repository.save(this.repository.create({ user_id, ...opts }));
  }

  async sumPriceByPeriod(user_id: number, period_at: Date, expires_at: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('usage')
      .select('SUM(usage.price)', 'sum')
      .where('usage.user_id = :user_id', { user_id })
      .andWhere('usage.create_at BETWEEN :start AND :end', { start: period_at, end: expires_at })
      .getRawOne();

    return parseFloat(result.sum);
  }
}
