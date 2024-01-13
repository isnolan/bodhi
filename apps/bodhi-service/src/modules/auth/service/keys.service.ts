import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'moment/locale/zh-cn';
import { AuthKeys } from '../entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthKeysService {
  constructor(
    @InjectRepository(AuthKeys)
    private readonly repository: Repository<AuthKeys>,
  ) {}

  /**
   * 记录会话
   * @param userId
   * @param ClientIp
   * @returns
   */
  async create(user_id: number, opts: Partial<AuthKeys>): Promise<AuthKeys> {
    const { note = '' } = opts;
    const secret_key = randomBytes(16).toString('hex');
    const model = this.repository.create({ user_id, secret_key, note });
    return await this.repository.save(model);
  }
}
