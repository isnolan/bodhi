import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'moment/locale/zh-cn';
import { AuthSession } from './entity/session.entity';

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
  async createOne(user_id: number, user_ip: string): Promise<AuthSession> {
    const expire_at = moment.utc().add(30, 'days').toDate();
    return await this.repository.save(plainToClass(AuthSession, { user_id, user_ip, expire_at }));
  }

  async findOne(id: number): Promise<AuthSession> {
    return await this.repository.findOne({ where: [{ id }] });
  }

  // async getTodaySession(userId: number): Promise<any> {
  //   const today: string = moment().format('YYYY-MM-DD 00:00:00.000');
  //   return await this.repository
  //     .createQueryBuilder('draft_users_session')
  //     .where('UserId=:userId AND CreateTime>=:today', { userId, today })
  //     .getOne();
  // }
}
