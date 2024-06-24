import { Injectable } from '@nestjs/common';

import { Users } from './entity/users.entity';
import { UserKeyService, UserProjectService } from './service';
import { UserBillingService } from './service/billing.service';
import { UsersUserService } from './service/user.service';
import { UserWalletService } from './service/wallet.service';

@Injectable()
export class UsersService {
  /* eslint max-params: */
  constructor(
    private readonly user: UsersUserService,
    private readonly keys: UserKeyService,
    private readonly project: UserProjectService,
    private readonly wallet: UserWalletService,
    private readonly billing: UserBillingService,
  ) {}

  async findUser(id: number): Promise<Users> {
    return this.user.findOne(id);
  }

  async findUserByEmail(email: string): Promise<Users> {
    return this.user.findOneByEmail(email);
  }

  async createUserWithEmail(email: string, opts: Partial<Users>): Promise<Users> {
    return this.user.createOneWithEmail(email, opts);
  }

  async validateKey(sk: string) {
    return this.keys.validateKey(sk);
  }

  async resetKeyBalance(user_id: number, key_id: number, balance: number) {
    return this.keys.resetBalance(user_id, key_id, balance);
  }

  async checkAvailableQuota(user_id: number, key_id: number) {
    return this.keys.findActive(user_id, key_id);
  }

  async checkAvailableBalance(user_id: number) {
    return this.wallet.findOneByUser(user_id);
  }

  async consumeKeyCredits(user_id: number, key_id: number, amount: number) {
    return this.keys.consumeCredits(user_id, key_id, amount);
  }

  async updateDraftBill(user_id: number, amount: number) {
    return this.billing.updateDraftBill(user_id, amount);
  }
}
