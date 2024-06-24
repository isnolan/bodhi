import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum BillingState {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('bodhi_users_billing')
export class UserBilling extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 6, comment: 'month', default: '' })
  month: string; // 账期

  @Column({ type: 'decimal', precision: 10, scale: 3, comment: 'amount' })
  amount: number; // 消费金额

  @Column({ type: 'enum', enum: BillingState, comment: '状态', default: BillingState.DRAFT })
  state: BillingState;
}
