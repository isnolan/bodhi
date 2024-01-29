import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionPlanService } from './plan.service';
import { SubscriptionQuotaService } from './quota.service';
import { SubscriptionSubscribedService } from './subscribed.service';
import { SubscriptionUsageService } from './usage.service';
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly plans: SubscriptionPlanService,
    private readonly quotas: SubscriptionQuotaService,
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly usage: SubscriptionUsageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyQuotaAllocation() {
    await this.allocateQuotas();
  }

  async allocateQuotas() {
    // 遍历所有订阅订单（已订阅）
    const activeSubscriptions = await this.subscribed.findAllActiveSubscriptions(); // 查找所有活跃的订阅
    // 检查是否尚未到期，如尚未到期则分配配额，否则标记为已过期
    const today = new Date();
    for (const subscription of activeSubscriptions) {
      const { id, user_id, plan_id, start_time, expire_time } = subscription;
      if (expire_time < today) {
        await this.subscribed.expireActive(id);
      } else {
        const quotas = await this.quotas.findQuotasByPlanId(plan_id); // 获取订阅的配额设置
        for (const quota of quotas) {
          const { id: quota_id, period } = quota;
          await this.usage.createUsageRecord(start_time, period, { user_id, plan_id, quota_id });
        }
      }
    }
  }
}
