import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { SubscriptionPlan } from './plan.entity';

@Entity('bodhi_subscription_quotas')
export class SubscriptionQuota extends Base {
  @Column({ type: 'int', comment: 'plan' })
  plan_id: number;

  @Column('int', { comment: 'model' })
  model_id: number; // 标识AI模型

  @Column('int', { comment: 'times limit', default: null, nullable: true })
  times_limit: number; // 调用次数限制

  @Column('bigint', { comment: 'tokens limit', default: null, nullable: true })
  token_limit: bigint; // Token消耗量限制，适用于基于tokens计费的场景

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.quotas)
  @JoinColumn()
  plan: SubscriptionPlan;
}
