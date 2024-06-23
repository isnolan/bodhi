import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserWallet } from '../entity';

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
}
