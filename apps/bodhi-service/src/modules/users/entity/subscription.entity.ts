import { Entity, Column } from 'typeorm';
import { Base } from '@/core/common/base.entity';

export enum SubscriptionState {
  VALID = 1,
  INVALID = 0,
  DELETED = -1,
}

@Entity('bodhi_users_subscription')
export class UsersSubscription extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'plan', default: 0 })
  plan_id: number;

  @Column({ type: 'datetime', comment: 'start date', nullable: true })
  start_at: Date;

  @Column({ type: 'datetime', comment: 'expire date', nullable: true })
  expire_at: Date;

  @Column({ type: 'tinyint', comment: 'status', default: SubscriptionState.VALID })
  status: SubscriptionState;

  // 订阅计划与订阅的关系：一对多
  // @OneToMany(() => Subscription, subscription => subscription.plan)
  // subscriptions: Subscription[];
}
