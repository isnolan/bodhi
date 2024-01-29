import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
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

  @Column('int', { comment: 'model' })
  model_id: number; // 标识AI模型

  @Column({ type: 'enum', enum: QuotaPeriod, comment: 'period', default: QuotaPeriod.DAILY })
  period: QuotaPeriod; // 配额时间周期

  @Column('int', { comment: 'times limit', default: 0 })
  times_limit: number; // 调用次数限制

  @Column('bigint', { comment: 'tokens limit', default: 0 })
  token_limit: bigint; // Token消耗量限制，适用于基于tokens计费的场景

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'id' })
  plan: SubscriptionPlan;
}
