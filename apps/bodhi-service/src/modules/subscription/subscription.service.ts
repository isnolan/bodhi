import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

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

  async findActiveUsageWithQuota(user_id: number, is_available?: boolean | undefined): Promise<UsageWithQuota[]> {
    const usages = await this.usage.findActiveWithQuota(user_id);
    if (is_available) {
      const rows: UsageWithQuota[] = [];
      usages.map((u) => {
        if (
          (u.quota.times_limit === -1 || u.quota.times_limit >= u.times_consumed) &&
          (u.quota.token_limit == -1 || u.quota.token_limit >= u.tokens_consumed)
        ) {
          rows.push(u);
        }
      });
      return rows;
    }
    return usages;
  }

  async comsumeUsageQuote(usage_id: number, times: number, tokens: number) {
    return this.usage.consumeQuote(usage_id, times, tokens);
  }
}
