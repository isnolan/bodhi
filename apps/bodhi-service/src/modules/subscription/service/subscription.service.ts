import moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionQuotaService } from './quota.service';
import { SubscriptionSubscribedService } from './subscribed.service';
import { SubscriptionUsageService } from './usage.service';
import { SubscribedState } from '../entity';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly quotas: SubscriptionQuotaService,
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly usage: SubscriptionUsageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyQuotaAllocation() {
    await this.allocateQuotas();
  }

  async allocateQuotas(skipMidnightCheck: boolean = false) {
    // all active subscribed subscriptions
    const activeSubscriptions = await this.subscribed.findAllActiveSubscriptions();
    // if not expired, allocate quotas, otherwise mark as expired
    const today = new Date();
    for (const subscription of activeSubscriptions) {
      const { id, user_id, plan_id, start_time, expire_time } = subscription;
      const timezone = subscription.user.timezone;
      // For a better user experience, midnight in the user's time zone is used as the allocation time point
      const allocationStart = skipMidnightCheck ? this.getStartOfTodayInUserTimezone(timezone) : today;
      if (skipMidnightCheck || this.isMidnightInUserTimezone(allocationStart, timezone)) {
        if (expire_time < today) {
          // update state to expired
          await this.subscribed.updateState(id, SubscribedState.EXPIRED);
        } else {
          const quotas = await this.quotas.findQuotasByPlanId(plan_id); // 获取订阅的配额设置
          for (const quota of quotas) {
            const { id: quota_id, period } = quota;
            await this.usage.allocateQuota(start_time, period, { user_id, plan_id, quota_id });
          }
          // update state to active
          await this.subscribed.updateState(id, SubscribedState.ACTIVE);
        }
      }
    }
  }

  /**
   * midnight in user's timezone
   * [Attention]It is worth noting that all subscription tasks must be executed within one hour, otherwise allocations may be missed
   * @param utcDate
   * @param timezone
   * @returns
   */
  isMidnightInUserTimezone(utcDate: Date, timezone: string): boolean {
    const userTime = moment(utcDate).tz(timezone);
    console.log(`[midnight]`, userTime, userTime.hours());
    // TODO: 0:00:00 ~ 1:00:00 in user's timezone
    return userTime.hours() === 0;
  }

  getStartOfTodayInUserTimezone(timezone: string): Date {
    return moment.tz(timezone).startOf('day').toDate();
  }
}
