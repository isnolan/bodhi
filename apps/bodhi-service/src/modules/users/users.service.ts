import Hashids from 'hashids/cjs';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { UsersKeysService } from './service';
import { UsersUserService } from './service/user.service';

@Injectable()
export class UsersService {
  constructor(private readonly user: UsersUserService, private readonly keys: UsersKeysService) {}

  async findOne(id: number): Promise<Users> {
    return this.user.findOne(id);
  }

  async findOneByEmail(email: string): Promise<Users> {
    return this.user.findOneByEmail(email);
  }

  async createOneWithEmail(email: string, opts: Partial<Users>): Promise<Users> {
    return this.user.createOneWithEmail(email, opts);
  }

  async checkAvailableQuota(key_id: number, model: string): Promise<boolean> {
    return this.keys.checkAvailableQuota(key_id, model);
  }

  async validateKey(secret_key: string) {
    return this.keys.validateKey(secret_key);
  }
}
