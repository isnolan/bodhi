import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { SubscriptionPlan } from './plan.entity';
import { SubscriptionUsage } from './usage.entity';

export enum SubscribedState {
  PENDING = 'pending', // 初始状态，尚未分配
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

@Entity('bodhi_subscription_subscribed')
export class SubscriptionSubscribed extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'plan', default: 0 })
  plan_id: number;

  @Column({ type: 'datetime', precision: 0, comment: 'start', nullable: true })
  start_at: Date;

  @Column({ type: 'datetime', precision: 0, comment: 'expires', nullable: true })
  expire_at: Date;

  @Column({ type: 'varchar', length: 40, comment: 'transaction', default: '' })
  transaction_id: string;

  @Column({ type: 'tinyint', comment: '是否续订', default: 1 })
  is_auto_renew: number;

  @Column({ type: 'enum', enum: SubscribedState, comment: 'state', default: SubscribedState.PENDING })
  state: SubscribedState;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'id' })
  plan: SubscriptionPlan;

  @OneToMany(() => SubscriptionUsage, 'subscribed')
  usage: SubscriptionUsage[];
}
