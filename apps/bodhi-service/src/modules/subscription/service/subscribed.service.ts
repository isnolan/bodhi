import { Repository, In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SubscribedState, SubscriptionSubscribed } from '../entity';

@Injectable()
export class SubscriptionSubscribedService {
  constructor(
    @InjectRepository(SubscriptionSubscribed)
    private readonly repository: Repository<SubscriptionSubscribed>,
  ) {}
  async findAllActiveSubscriptions(): Promise<SubscriptionSubscribed[]> {
    return this.repository.find({
      where: {
        state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]),
      },
      relations: ['user'],
    });
  }

  public async findActiveByUserId(user_id: number): Promise<SubscriptionSubscribed[]> {
    return this.repository.find({
      select: {
        id: true,
        plan_id: true,
        start_time: true,
        expire_time: true,
        is_auto_renew: true,
        state: true,
        create_time: true,
        plan: {
          id: true,
          title: true,
          description: true,
          monthly_price: true,
        },
        usage: {
          id: true,
          quota_id: true,
          period_start: true,
          period_end: true,
          times_consumed: true,
          tokens_consumed: true,
          state: true,
          create_time: true,
        },
      },
      where: {
        user_id,
        state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]),
      },
      relations: ['plan', 'usage'],
    });
  }

  public async expireActive(id: number) {
    return this.repository.update(id, { state: SubscribedState.EXPIRED });
  }

  public async updateState(id: number, state: SubscribedState) {
    return this.repository.update(id, { state });
  }
}
