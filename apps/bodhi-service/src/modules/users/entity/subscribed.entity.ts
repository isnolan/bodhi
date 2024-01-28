import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { Users } from './users.entity';
import { SubscriptionPlan } from '@/modules/subscription/entity/plan.entity';

export enum SubscribedPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('bodhi_users_subscribed')
export class UsersSubscribed extends Base {
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

  @Column({ enum: SubscribedPeriod, comment: 'period', default: SubscribedPeriod.MONTHLY })
  period: SubscribedPeriod; // 如 "monthly", "yearly"

  // @ManyToOne(() => Users)
  // @JoinColumn()
  // user: Users;

  // @ManyToOne(() => SubscriptionPlan)
  // @JoinColumn()
  // subscription_plan: SubscriptionPlan;
}
