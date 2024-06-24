import { Injectable } from '@nestjs/common';

import { Users } from './entity/users.entity';
import { UserKeyService, UserWebhookService } from './service';
import { UserBillingService } from './service/billing.service';
import { UsersUserService } from './service/user.service';
import { UserWalletService } from './service/wallet.service';

@Injectable()
export class UsersService {
  /* eslint max-params: */
  constructor(
    private readonly user: UsersUserService,
    private readonly keys: UserKeyService,
    private readonly webhook: UserWebhookService,
    private readonly wallet: UserWalletService,
    private readonly billing: UserBillingService,
  ) {}

  async findOne(id: number): Promise<Users> {
    return this.user.findOne(id);
  }

  async findOneByEmail(email: string): Promise<Users> {
    return this.user.findOneByEmail(email);
  }

  async createOneWithEmail(email: string, opts: Partial<Users>): Promise<Users> {
    return this.user.createOneWithEmail(email, opts);
  }

  async validateKey(secret_key: string) {
    return this.keys.validateKey(secret_key);
  }

  async resetKeyBalance(user_id: number, key_id: number, balance: number) {
    return this.keys.resetBalance(user_id, key_id, balance);
  }

  async findActiveWebhook(user_id: number) {
    return this.webhook.findActive(user_id);
  }

  async checkAvailableQuota(user_id: number, key_id: number) {
    return this.keys.findActive(user_id, key_id);
  }

  async checkAvailableBalance(user_id: number) {
    return this.wallet.findOneByUser(user_id);
  }

  async consumeUsage(user_id: number, key_id: number, sale_credit: number) {
    return this.keys.decrementBalance(user_id, key_id, sale_credit);
  }

  async updateDraftBill(user_id: number, amount: number) {
    return this.billing.updateDraftBill(user_id, amount);
  }
}
