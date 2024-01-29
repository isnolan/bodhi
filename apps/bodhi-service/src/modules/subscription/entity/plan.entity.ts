import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { SubscriptionQuota } from './quota.entity';

export enum PlanState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_subscription_plans')
export class SubscriptionPlan extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'ID', default: '' })
  product_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'Title', default: '' })
  title: string;

  @Column({ type: 'text', comment: 'Description', default: null })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Price', default: 0 })
  monthly_price: number;

  // 折扣金额，表示年订阅相对于月订阅总成本的节省金额
  @Column('decimal', { precision: 10, scale: 2, comment: 'Yearly discount', default: 0 })
  yearly_discount: number;

  @Column({ type: 'tinyint', comment: 'status', default: PlanState.ACTIVE })
  status: number;

  @OneToMany(() => SubscriptionQuota, 'plan')
  quotas: SubscriptionQuota[];
}
