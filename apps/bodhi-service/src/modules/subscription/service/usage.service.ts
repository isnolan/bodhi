import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import { In, LessThan, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { SubscriptionConsumed } from '../dto/consume.dto';
import { QuotaType, SubscribedState, SubscriptionUsage } from '../entity';

@Injectable()
export class SubscriptionUsageService {
  constructor(
    @InjectRepository(SubscriptionUsage)
    private readonly repository: Repository<SubscriptionUsage>,
  ) {}

  public async allocateQuota(allocationStart: Date, period: string, opts: Partial<SubscriptionUsage>) {
    // 计算当前配额周期的开始日期，基于订阅的开始时间和配额的重置周期
    const { periodStart: period_at, periodEnd: expires_at } = this.calculatePeriod(allocationStart, period);
    // 检查是否已存在对应当前周期的Usage记录
    const today = new Date();
    const { subscribed_id, quota_id } = opts;
    const count = await this.repository.count({
      where: { subscribed_id, quota_id, period_at: LessThan(today), expires_at: MoreThanOrEqual(today) },
    });
    if (count === 0) {
      await this.repository.save(this.repository.create({ ...opts, period_at, expires_at }));
    }
  }

  private calculatePeriod(startDate: Date, resetPeriod: string): { periodStart: Date; periodEnd: Date } {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // 规范化订阅开始时间到零时
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 今天的开始时间

    // 计算从订阅开始到今天的完整周期数
    const fullCyclesSinceStart = (today.getTime() - start.getTime()) / (1000 * 3600 * 24); // 天数

    if (resetPeriod === 'daily') {
      return {
        periodStart: today,
        periodEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, -1),
      };
    }

    if (resetPeriod === 'weekly') {
      const daysSinceLastWeekStart = fullCyclesSinceStart % 7;
      const periodStart = new Date(today);
      periodStart.setDate(today.getDate() - daysSinceLastWeekStart);
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 7);
      periodEnd.setSeconds(-1);
      return { periodStart, periodEnd };
    }

    if (resetPeriod === 'monthly') {
      const monthDiff = today.getMonth() - start.getMonth() + 12 * (today.getFullYear() - start.getFullYear());
      const fullMonthsSinceStart = monthDiff % 12;
      const periodStart = new Date(start.getFullYear(), start.getMonth() + fullMonthsSinceStart, 1);
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);
      periodEnd.setSeconds(-1);
      return { periodStart, periodEnd };
    }

    if (resetPeriod === 'quarterly') {
      const quarterDiff =
        Math.floor((today.getMonth() - start.getMonth()) / 3) + 4 * (today.getFullYear() - start.getFullYear());
      const fullQuartersSinceStart = quarterDiff % 4;
      const periodStart = new Date(start.getFullYear(), start.getMonth() + fullQuartersSinceStart * 3, 1);
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 1);
      periodEnd.setSeconds(-1);
      return { periodStart, periodEnd };
    }

    if (resetPeriod === 'yearly') {
      const yearsSinceStart = today.getFullYear() - start.getFullYear();
      const periodStart = new Date(start.getFullYear() + yearsSinceStart, 0, 1);
      const periodEnd = new Date(periodStart.getFullYear() + 1, 0, 1);
      periodEnd.setSeconds(-1);
      return { periodStart, periodEnd };
    }

    throw new Error(`Unknown reset period: ${resetPeriod}`);
  }

  public async findActiveWithQuota(user_id: number, type = QuotaType.CHAT): Promise<SubscriptionUsage[]> {
    const today = moment().startOf('day').toDate();
    const quota = { id: true, type: true, quotas: true };
    return this.repository.find({
      select: { id: true, quota_id: true, consumed: true, quota },
      where: {
        user_id,
        period_at: LessThanOrEqual(today),
        expires_at: MoreThanOrEqual(today),
        state: In([SubscribedState.ACTIVE, SubscribedState.PENDING]),
        quota: { type },
      },
      relations: ['quota'],
    });
  }

  public async consumeQuote(id: number, c: SubscriptionConsumed) {
    if (c.times && c.times > 0) {
      await this.repository.increment({ id }, 'times_consumed', c.times);
    }

    if (c.times && c.tokens > 0) {
      await this.repository.increment({ id }, 'tokens_consumed', c.tokens);
    }
  }
}
