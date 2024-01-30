import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthVerification, VerificationState, VerificationType } from '../entity/verification.entity';

@Injectable()
export class AuthVerificationsService {
  constructor(
    @InjectRepository(AuthVerification)
    private readonly repository: Repository<AuthVerification>,
  ) {}

  async createOne(type: VerificationType, account, client_ip): Promise<AuthVerification> {
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expires_at = moment.utc().add(5, 'minutes').toDate();
    const state = VerificationState.PENDING;
    const model = plainToClass(AuthVerification, { type, account, code, expires_at, client_ip, state });
    return await this.repository.save(model);
  }

  /**
   * 检查验证码有效性
   */
  async isValid(account: string, code: string): Promise<false | AuthVerification> {
    const res = await this.repository.findOne({ where: { account, code } });
    if (!res) {
      return false;
    }

    if (res.expires_at < new Date()) {
      return false;
    }
    return res;
  }

  /**
   * 消费验证码
   */
  async consume(id: number) {
    const model = plainToClass(AuthVerification, { id, state: VerificationState.VERIFIED });
    return await this.repository.save(model);
  }
}
