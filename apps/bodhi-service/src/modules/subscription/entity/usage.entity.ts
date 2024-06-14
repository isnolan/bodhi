import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Base } from '@/core/common/base.entity';

import { SubscriptionQuota } from './quota.entity';
import { SubscriptionSubscribed } from './subscribed.entity';

export enum UsageState {
  PENDING = 'pending', // 初始状态，尚未分配
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('bodhi_subscription_usage')
export class SubscriptionUsage extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'int', comment: 'subscribed' })
  subscribed_id: number;

  @Column({ type: 'int', comment: 'quota' })
  quota_id: number;

  @Column({ type: 'datetime', precision: 0, comment: 'start', nullable: true })
  period_at: Date; // 当前周期开始时间

  @Column({ type: 'datetime', precision: 0, comment: 'expires', nullable: true })
  expires_at: Date; // 当前周期结束时间

  @Column({ type: 'int', comment: 'times', default: 0 })
  times_consumed: number; // 在当前周期内已使用的调用次数

  @Column({ type: 'int', comment: 'credits', default: 0 })
  credits_consumed: number; // 在当前周期内已消耗的信用额度

  @Column({ type: 'bigint', comment: 'tokens', default: 0 })
  tokens_consumed: number; // 在当前周期内已消耗的Token数量

  @Column({ type: 'enum', enum: UsageState, comment: 'state', default: UsageState.PENDING })
  state: UsageState;

  @ManyToOne(() => SubscriptionQuota)
  @JoinColumn({ name: 'quota_id', referencedColumnName: 'id' })
  quota: SubscriptionQuota;

  @ManyToOne(() => SubscriptionSubscribed)
  @JoinColumn({ name: 'subscribed_id', referencedColumnName: 'id' })
  subscribed: SubscriptionSubscribed;
}
