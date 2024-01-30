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

  async findActiveWithUser(): Promise<SubscriptionSubscribed[]> {
    return this.repository.find({
      where: {
        state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]),
      },
      relations: ['user'],
    });
  }

  public async findActiveWithPlanAndUsage(user_id: number, relations?: string[]): Promise<SubscriptionSubscribed[]> {
    return this.repository.find({
      where: { user_id, state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]) },
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
