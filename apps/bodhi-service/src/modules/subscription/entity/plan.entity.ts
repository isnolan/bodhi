import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { SubscriptionQuota } from './quota.entity';

@Entity('bodhi_subscription_plan')
export class SubscriptionPlan extends Base {
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

  // 可以根据需要添加其他套餐特性
  // 可以添加其他如状态字段来标识订阅是否有效等
  @OneToMany(() => SubscriptionQuota, (quota) => quota.plan)
  quotas: SubscriptionQuota[];
}
