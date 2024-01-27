import { Entity, Column } from 'typeorm';
import { Base } from '@/core/common/base.entity';

export enum PaymentsState {
  VALID = 1,
  INVALID = 0,
  DELETED = -1,
}

@Entity('bodhi_users_payments')
export class UsersPayments extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'plan', default: 0 })
  plan_id: number;

  @Column({ type: 'int', comment: 'amount', default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 40, comment: 'transaction id', default: '' })
  transaction_id: string;

  @Column({ type: 'tinyint', comment: 'status', default: PaymentsState.VALID })
  status: PaymentsState;
}
