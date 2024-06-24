import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TradeType, UserWallet } from '../entity';

@Injectable()
export class UserWalletService {
  constructor(
    @InjectRepository(UserWallet)
    private readonly repository: Repository<UserWallet>,
  ) {}

  async findOneByUser(user_id: number) {
    return this.repository.findOne({
      select: ['id', 'user_id', 'amount', 'balance', 'trade_type'],
      where: { user_id },
      order: { id: 'DESC' },
    });
  }

  async decrementBalance(user_id: number, amount: number, trade_id = 0, trade_reason = '') {
    // 获取当前余额
    const { balance } = await this.repository.findOne({ where: { user_id }, order: { id: 'DESC' } });
    // 更新余额

    return this.repository.save(
      this.repository.create({
        user_id,
        amount: -amount,
        balance: balance - amount,
        trade_type: TradeType.CONSUME,
        trade_id,
        trade_reason,
      }),
    );
  }
}
