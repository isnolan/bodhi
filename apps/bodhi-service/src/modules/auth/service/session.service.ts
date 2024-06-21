import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import * as moment from 'moment-timezone';
import { Repository } from 'typeorm';

import { AuthSession } from '../entity/session.entity';

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(AuthSession)
    private readonly repository: Repository<AuthSession>,
  ) {}

  /**
   * 记录会话
   * @param userId
   * @param ClientIp
   * @returns
   */
  async createOne(user_id: number, user_ip: string, locale?: string): Promise<AuthSession> {
    const expires_at = moment.utc().add(30, 'days').toDate();
    return await this.repository.save(plainToClass(AuthSession, { user_id, user_ip, expires_at, locale }));
  }

  async findOne(id: number): Promise<AuthSession> {
    return await this.repository.findOne({ where: [{ id }] });
  }

  async validateSession(id: number): Promise<AuthSession | null> {
    const session = await this.repository.findOne({ where: { id } });
    // console.log(`->session`, session);
    if (session.expires_at < new Date() || session.status < 1) {
      return null;
    }
    return session;
  }
}
