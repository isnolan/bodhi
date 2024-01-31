import { Injectable } from '@nestjs/common';
import { Users } from './entity/users.entity';
import { UserKeyService, UserKeyUsageService } from './service';
import { UsersUserService } from './service/user.service';
import { UserKeyUsage } from './entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly user: UsersUserService,
    private readonly keys: UserKeyService,
    private readonly usage: UserKeyUsageService,
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

  async checkAvailableQuota(key_id: number, model: string): Promise<number> {
    return this.usage.checkAvailableQuota(key_id, model);
  }

  async validateKey(secret_key: string) {
    return this.keys.validateKey(secret_key);
  }

  async consumeKeyQuote(key_id: number, times: number, tokens: number) {
    return this.usage.consumeKeyQuote(key_id, times, tokens);
  }

  async increaseKeyUsage(user_id: number, foreign_user_id: string, opts: Partial<UserKeyUsage>) {
    // check
    const key = await this.keys.find(user_id, foreign_user_id);
    if (!key) {
      throw new Error(`key not found`);
    }

    return this.usage.increaseUsage(key.id, opts);
  }
}
