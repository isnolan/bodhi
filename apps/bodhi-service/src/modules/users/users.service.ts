import { Injectable } from '@nestjs/common';

import { UserKey } from './entity';
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

  async createKey(user_id: number, opts: Partial<UserKey>) {
    return this.keys.createKey(user_id, opts);
  }

  async updateKeyCredits(user_id: number, sk: string, credits: number) {
    return this.keys.updateCredits(user_id, sk, credits);
  }

  async findWebhookByKeyId(user_id, key_id: number) {
    const key = await this.keys.findOne(user_id, key_id);
    const { webhook, secret } = await this.project.findOne(key.project_id);
    return { sk: key.sk, webhook, secret };
  }

  async checkAvailableQuota(user_id: number, key_id: number) {
    return this.keys.findOne(user_id, key_id);
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
