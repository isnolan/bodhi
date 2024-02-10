import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { SubscriptionPlan } from './plan.entity';
export enum QuotaPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('bodhi_subscription_quotas')
export class SubscriptionQuota extends Base {
  @Column({ type: 'int', comment: 'plan' })
  plan_id: number;

  @Column({ type: 'simple-array', comment: 'providers', default: null })
  providers: number[]; // provider id list

  @Column({ type: 'enum', enum: QuotaPeriod, comment: 'period', default: QuotaPeriod.DAILY })
  period: QuotaPeriod; // 配额时间周期

  @Column('int', { comment: 'times limit', default: 0 })
  times_limit: number; // -1: unlimited, 0: disabled, >0: available

  @Column('int', { comment: 'tokens limit', default: 0 })
  token_limit: number; // -1: unlimited, 0: disabled, >0: available

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'id' })
  plan: SubscriptionPlan;
}
