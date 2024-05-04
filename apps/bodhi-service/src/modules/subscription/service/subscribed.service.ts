import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import { In, MoreThan, Repository } from 'typeorm';

import { SubscribedState, SubscriptionSubscribed } from '../entity';

@Injectable()
export class SubscriptionSubscribedService {
  constructor(
    @InjectRepository(SubscriptionSubscribed)
    private readonly repository: Repository<SubscriptionSubscribed>,
  ) {}

  async findActive(): Promise<SubscriptionSubscribed[]> {
    return this.repository.find({
      where: {
        state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]),
      },
    });
  }

  public async findActiveWithPlanAndUsage(user_id: number): Promise<SubscriptionSubscribed[]> {
    return this.repository.find({
      where: { user_id, state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]) },
      relations: ['usage'],
    });
  }

  async createTrial(user_id: number, plan_id: number, transaction_id = 'trial', days = 30) {
    // check if already subscribed
    const start_at = moment.utc().toDate();
    const subscribed = await this.repository.findOne({
      where: {
        user_id,
        plan_id,
        expires_at: MoreThan(start_at),
        state: In([SubscribedState.PENDING, SubscribedState.ACTIVE]),
      },
    });
    if (subscribed) {
      return subscribed;
    }

    // create
    const state = SubscribedState.PENDING;
    const expires_at = moment(start_at).add(days, 'days').toDate();
    return await this.repository.save(
      this.repository.create({ user_id, plan_id, start_at, expires_at, transaction_id, state }),
    );
  }

  /**
   * Find and create subscription by transaction_id
   * will be called by purchase receipt validation or renewal notification
   * Important: 对于未能及时同步但已过期的订单，可能会出现创建过期订阅的情况
   * @param transaction_id
   * @param opts
   * @returns
   */
  async findAndCreateByTransactionId(transaction_id: string, opts: Partial<SubscriptionSubscribed>) {
    // check if already have active subscription
    const { user_id, plan_id, start_at, expires_at, state } = opts;

    const subscribed = await this.repository.findOne({
      where: {
        transaction_id,
        expires_at: MoreThan(start_at),
        state: In([SubscribedState.PENDING, SubscribedState.ACTIVE]),
      },
    });
    if (subscribed) {
      // check if user_id is not linked
      if (subscribed.user_id === 0) {
        this.repository.update(subscribed.id, { user_id });
      }
      return subscribed;
    }

    // create
    return await this.repository.save(
      this.repository.create({ user_id, plan_id, start_at, expires_at, transaction_id, state }),
    );
  }

  public async expireActive(id: number) {
    return this.repository.update(id, { state: SubscribedState.EXPIRED });
  }

  public async updateState(id: number, state: SubscribedState) {
    return this.repository.update(id, { state });
  }
}
