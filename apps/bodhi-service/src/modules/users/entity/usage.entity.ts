import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '@/core/common/base.entity';
// import { Users } from './users.entity';
// import { SubscriptionPlan } from '@/modules/subscription/entity/plan.entity';
// import { SubscriptionQuota } from '@/modules/subscription/entity/quota.entity';

@Entity('bodhi_users_usage')
export class UsersUsage extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column()
  period_Start: Date; // 当前周期开始时间

  @Column()
  period_end: Date; // 当前周期结束时间

  @Column('int')
  times_consumed: number; // 在当前周期内已使用的调用次数

  @Column('bigint', { nullable: true, default: () => "'0'" })
  tokens_consumed: bigint; // 在当前周期内已消耗的Token数量

  // @ManyToOne(() => Users, (user) => user.id)
  // @JoinColumn()
  // user: Users;

  // @ManyToOne(() => SubscriptionQuota, (quota) => quota.id)
  // @JoinColumn()
  // subscriptionPlanQuota: SubscriptionQuota;
}
