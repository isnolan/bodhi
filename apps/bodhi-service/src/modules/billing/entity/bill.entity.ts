import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum BillState {
  PENDING = 'pending', // 未结算
  PAID = 'paid', // 已结算
  CANCELLED = 'cancelled', // 已取消
}

@Entity('bodhi_billing_bill')
export class BillingBill extends Base {
  @ApiProperty()
  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'datetime', precision: 0, comment: 'start', nullable: true })
  billing_cycle_start: Date; // 账单开始时间

  @Column({ type: 'datetime', precision: 0, comment: 'end', nullable: true })
  billing_cycle_end: Date; // 账单结束时间

  @Column({ type: 'int', comment: 'user_id', default: 0 })
  credit_recharge: number;

  @Column({ type: 'int', comment: 'user_id', default: 0 })
  credit_quotas: number;

  @Column({ type: 'int', comment: 'user_id', default: 0 })
  credit_total: number;

  @Column({ type: 'enum', enum: BillState, comment: 'state', default: BillState.PENDING })
  state: BillState;
}
