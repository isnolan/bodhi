import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'moment/locale/zh-cn';
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
    const expire_at = moment.utc().add(30, 'days').toDate();
    return await this.repository.save(plainToClass(AuthSession, { user_id, user_ip, expire_at, locale }));
  }

  async findOne(id: number): Promise<AuthSession> {
    return await this.repository.findOne({ where: [{ id }] });
  }

  async validateSession(id: number): Promise<AuthSession | null> {
    const session = await this.repository.findOne({ where: { id } });
    if (session.expire_at < new Date() || session.status < 1) {
      return null;
    }
    return session;
  }
}
