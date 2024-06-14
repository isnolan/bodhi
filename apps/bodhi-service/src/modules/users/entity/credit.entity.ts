import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum TradeType {}

@Entity('bodhi_users_credits')
export class UserCredit extends Base {
  @ApiProperty()
  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'amount', default: 0 })
  amount: number;

  @Column({ type: 'int', comment: 'balance', default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 20, comment: 'trade type' })
  trade_type: string;

  @Column({ type: 'int', comment: 'trade id' })
  trade_id: number;
}
