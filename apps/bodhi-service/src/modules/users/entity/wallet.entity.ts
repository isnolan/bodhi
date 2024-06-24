import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum TradeType {
  RECHARGE = 'recharge', // 充值
  CONSUME = 'consume', // 消费
  PERZENT = 'perzent', // 赠送
  WITHDRAW = 'withdraw', // 提现
}

@Entity('bodhi_users_wallet')
export class UserWallet extends Base {
  @ApiProperty()
  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, comment: 'cost in', default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, comment: 'balance', default: 0 })
  balance: number;

  @Column({ type: 'enum', enum: TradeType, comment: 'trade type', default: TradeType.CONSUME })
  trade_type: TradeType; // 交易类型

  @Column({ type: 'int', comment: 'trade id', default: 0 })
  trade_id: number; // 交易单据: 充值订单/消费订单 id

  @Column({ type: 'varchar', length: 40, comment: 'reason' })
  trade_reason: string; // 交易缘由
}
