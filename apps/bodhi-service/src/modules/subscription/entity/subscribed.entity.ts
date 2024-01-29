import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { SubscriptionPlan } from './plan.entity';

export enum SubscribedPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscribedState {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

@Entity('bodhi_subscription_subscribed')
export class SubscriptionSubscribed extends Base {
  @Column({ type: 'int', comment: 'User', default: 0 })
  user_id: number;

  @Column({ type: 'datetime', precision: 0, comment: '开始时间', nullable: true })
  start_time: Date;

  @Column({ type: 'datetime', precision: 0, comment: '结束时间', nullable: true })
  expire_time: Date;

  @Column({ type: 'datetime', precision: 0, comment: '宽限期', nullable: true })
  grace_expire_time: Date;

  @Column({ type: 'varchar', length: 40, comment: '销售凭证ID', default: '' })
  sales_transaction_id: string;

  @Column({ type: 'tinyint', comment: '是否续订', default: 1 })
  is_auto_renew: number;

  @Column({ type: 'enum', enum: SubscribedState, comment: 'state', default: SubscribedState.PENDING })
  state: SubscribedState;

  @Column({ type: 'enum', enum: SubscribedPeriod, comment: 'period', default: SubscribedPeriod.WEEKLY })
  subscribed_period: SubscribedPeriod;

  // @ManyToOne(() => SubscriptionPlan)
  // @JoinColumn()
  // subscription_plan: SubscriptionPlan;
}
