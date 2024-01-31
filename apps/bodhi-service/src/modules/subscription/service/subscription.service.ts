import { Injectable } from '@nestjs/common';
import { SubscriptionQuotaService } from './quota.service';
import { SubscriptionSubscribedService } from './subscribed.service';
import { SubscriptionUsageService } from './usage.service';
import { SubscriptionPlanService } from './plan.service';
import { UsageWithQuota } from '../dto/find-useage.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly plans: SubscriptionPlanService,
    private readonly quotas: SubscriptionQuotaService,
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly usage: SubscriptionUsageService,
  ) {}

  public async findActiveSubscribedWithPlansAndUsage(user_id: number) {
    return this.subscribed.findActiveWithPlanAndUsage(user_id);
  }

  public async findActiveUsageWithQuota(
    user_id: number,
    is_available?: boolean | undefined,
  ): Promise<UsageWithQuota[]> {
    const usages = await this.usage.findActiveWithQuota(user_id);
    if (is_available) {
      const rows: UsageWithQuota[] = [];
      usages.map((u) => {
        if (
          (u.quota.times_limit === -1 || u.quota.times_limit >= u.times_consumed) &&
          (u.quota.token_limit === -1 || u.quota.token_limit >= u.tokens_consumed)
        ) {
          rows.push(u);
        }
      });
      return rows;
    }
    return usages;
  }

  public async comsumeUsageQuote(usage_id: number, times: number, tokens: number) {
    return this.usage.consumeQuote(usage_id, times, tokens);
  }
}
