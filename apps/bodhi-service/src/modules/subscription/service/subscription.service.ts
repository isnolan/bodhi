import moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionQuotaService } from './quota.service';
import { SubscriptionSubscribedService } from './subscribed.service';
import { SubscriptionUsageService } from './usage.service';
import { SubscribedState } from '../entity';
import { SubscriptionPlanService } from './plan.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly plans: SubscriptionPlanService,
    private readonly quotas: SubscriptionQuotaService,
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly usage: SubscriptionUsageService,
  ) {}

  public async findActivePlansByUserId(user_id: number) {
    return this.subscribed.findActiveWithPlanAndUsage(user_id);
  }

  public async findActiveProvidersByUser(user_id: number): Promise<number[]> {
    const subscribeds = await this.subscribed.findActiveWithPlanAndUsage(user_id);
    if (subscribeds.length === 0) {
      throw new Error(`No active subscription`);
    }
    const quota_ids = subscribeds.map((subscribed) => subscribed.usage.map((usage) => usage.quota_id));
    return await this.quotas.findProvidersByIds(Array.from(new Set(quota_ids.flat())));
  }
}
