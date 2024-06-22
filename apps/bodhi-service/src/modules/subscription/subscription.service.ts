import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { SubscriptionConsumed } from './dto/consume.dto';
import { UsageWithQuota } from './dto/find-useage.dto';
import { SubscriptionSubscribed } from './entity';
import { SubscriptionPlanService, SubscriptionSubscribedService, SubscriptionUsageService } from './service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    private readonly plans: SubscriptionPlanService,
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly usage: SubscriptionUsageService,
  ) {}

  async findPlans() {
    return this.plans.findActive();
  }

  async findPlansBySimple() {
    return this.plans.findSimpleList();
  }

  // find and create subscribed by transaction_id
  async findAndCreateByTransactionId(transaction_id: string, opts: Partial<SubscriptionSubscribed>) {
    return this.subscribed.findAndCreateByTransactionId(transaction_id, opts);
  }

  // create trail subscribed
  async createTrial(user_id: number, plan_id = 100) {
    const subscribed = await this.subscribed.createTrial(user_id, plan_id);
    // aollcate usage quota
    this.queue.add('subscribed', { subscribed_id: subscribed.id });
    return subscribed;
  }

  async findActiveSubscribedWithPlansAndUsage(user_id: number) {
    return this.subscribed.findActiveWithPlanAndUsage(user_id);
  }

  async findActiveUsageWithQuota(user_id: number, budget = 0): Promise<UsageWithQuota[]> {
    const usages = await this.usage.findActiveWithQuota(user_id);
    const rows: UsageWithQuota[] = [];
    usages.map((u) => {
      if (u.quota.quotas === -1 || u.quota.quotas - u.consumed >= budget) {
        rows.push(u);
      }
    });
    return rows;
  }

  async comsumeUsageQuote(usage_id: number, consumed: SubscriptionConsumed) {
    return this.usage.consumeQuote(usage_id, consumed);
  }
}
