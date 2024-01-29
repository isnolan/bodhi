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
    const subscribed = await this.subscribed.findActiveByUserId(user_id);
    console.log(`->subscribed`, subscribed);
    return subscribed;
    if (subscribed.length === 0) {
      throw new Error(`No active subscription`);
    }

    const plan_ids = subscribed.map((c) => c.plan_id);
    const plans = await this.plans.findActiveByIds(plan_ids);
    if (plans.length === 0) {
      throw new Error(`No active plan`);
    }

    return plans;
  }
}
