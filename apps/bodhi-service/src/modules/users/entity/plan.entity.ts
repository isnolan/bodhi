import { Entity, Column } from 'typeorm';
import { Base } from '@/core/common/base.entity';

export enum PlanState {
  VALID = 1,
  INVALID = 0,
  DELETED = -1,
}

@Entity('bodhi_users_plans')
export class UsersPlans extends Base {
  @Column({ type: 'varchar', length: 40, comment: 'name', default: '' })
  name: string;

  @Column({ type: 'varchar', length: 100, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'int', comment: 'price', default: 0 })
  price: number;

  @Column({ type: 'int', comment: 'duration', default: 0 })
  duration: number; // 持续时间，例如30天、365天等

  @Column({ type: 'datetime', comment: 'ExpireAt', nullable: true })
  expire_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: PlanState.VALID })
  status: PlanState;

  // 订阅计划与订阅的关系：一对多
  // @OneToMany(() => Subscription, subscription => subscription.plan)
  // subscriptions: Subscription[];
}
