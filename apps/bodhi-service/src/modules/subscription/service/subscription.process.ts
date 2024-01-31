import moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionQuotaService } from './quota.service';
import { SubscriptionSubscribedService } from './subscribed.service';
import { SubscriptionUsageService } from './usage.service';
import { SubscribedState } from '../entity';
import { SubscriptionPlanService } from './plan.service';
import { UsersService } from '@/modules/users/users.service';

const Expression = process.env.NODE_ENV === 'production' ? CronExpression.EVERY_HOUR : CronExpression.EVERY_10_MINUTES;

@Injectable()
export class SubscriptionProcessService {
  constructor(
    private readonly plans: SubscriptionPlanService,
    private readonly quotas: SubscriptionQuotaService,
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly usage: SubscriptionUsageService,
    private readonly users: UsersService,
  ) {}

  // @Cron(CronExpression.EVERY_HOUR)
  @Cron(Expression)
  async handleDailyQuotaAllocation() {
    await this.allocateQuotas(process.env.NODE_ENV !== 'production');
  }

  public async allocateQuotas(skipMidnightCheck: boolean = false) {
    // all active subscribed subscriptions
    const activeSubscriptions = await this.subscribed.findActive();
    console.log(`[cron]allocate`, activeSubscriptions.length, `active subscriptions`);
    // if not expired, allocate quotas, otherwise mark as expired
    const today = new Date();
    for (const subscription of activeSubscriptions) {
      const { id, user_id, plan_id, start_at, expire_at } = subscription;
      const { timezone } = await this.users.findOne(user_id);
      // For a better user experience, midnight in the user's time zone is used as the allocation time point
      const allocationStart = skipMidnightCheck ? this.getStartOfTodayInUserTimezone(timezone) : today;

      if (skipMidnightCheck || this.isMidnightInUserTimezone(allocationStart, timezone)) {
        console.log(`[cron]`, subscription.id, 'allocating quotas');
        if (expire_at < today) {
          // update state to expired
          await this.subscribed.updateState(id, SubscribedState.EXPIRED);
        } else {
          const quotas = await this.quotas.findQuotasByPlanId(plan_id); // 获取订阅的配额设置
          for (const quota of quotas) {
            const { id: quota_id, period } = quota;
            await this.usage.allocateQuota(start_at, period, { user_id, subscribed_id: subscription.id, quota_id });
          }
          // update state to active
          await this.subscribed.updateState(id, SubscribedState.ACTIVE);
        }
      } else {
        console.log(`[cron]`, subscription.id, 'skipping allocation', skipMidnightCheck);
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
  private isMidnightInUserTimezone(utcDate: Date, timezone: string): boolean {
    const userTime = moment(utcDate).tz(timezone);
    console.log(`[cron]midnight`, userTime, userTime.hours());
    // TODO: 0:00:00 ~ 1:00:00 in user's timezone
    return userTime.hours() === 0;
  }

  private getStartOfTodayInUserTimezone(timezone: string): Date {
    return moment.tz(timezone).startOf('day').toDate();
  }
}
