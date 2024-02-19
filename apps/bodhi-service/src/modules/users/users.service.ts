import { Injectable } from '@nestjs/common';
import { Users } from './entity/users.entity';
import { UserKeyService, UserUsageService, UserWebhookService } from './service';
import { UsersUserService } from './service/user.service';
import { UserUsage } from './entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly user: UsersUserService,
    private readonly keys: UserKeyService,
    private readonly usage: UserUsageService,
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

  async checkAvailableQuota(client_user_id: string, model: string): Promise<number> {
    return this.usage.checkAvailable(client_user_id, model);
  }

  async validateKey(secret_key: string) {
    return this.keys.validateKey(secret_key);
  }

  async consumeUsage(usage_id: number, times: number, tokens: number) {
    return this.usage.consume(usage_id, times, tokens);
  }

  async allocateUsage(user_id: number, opts: Partial<UserUsage>) {
    return this.usage.allocate(user_id, opts);
  }

  async findActiveWebhook(user_id: number) {
    return this.webhook.findActive(user_id);
  }
}
