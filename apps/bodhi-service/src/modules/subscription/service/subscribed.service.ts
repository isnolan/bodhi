import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
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
    });
  }
  async expireActive(id: number) {
    return this.repository.update(id, { state: SubscribedState.EXPIRED });
  }
}
