import { Injectable } from '@nestjs/common';

import { UserKey } from './entity';
import { Users } from './entity/users.entity';
import { UserKeyService, UserWebhookService } from './service';
import { UsersUserService } from './service/user.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly user: UsersUserService,
    private readonly keys: UserKeyService,
    private readonly webhook: UserWebhookService,
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

  async updateKeyBalance(user_id: number, opts: Partial<UserKey>) {
    return this.keys.updateBalance(user_id, opts);
  }

  async findActiveWebhook(user_id: number) {
    return this.webhook.findActive(user_id);
  }
}
