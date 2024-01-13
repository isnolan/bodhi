import Hashids from 'hashids/cjs';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUsers } from './entity/users.entity';

@Injectable()
export class AuthUsersService {
  private readonly hashids: Hashids;

  constructor(
    @InjectRepository(AuthUsers)
    private readonly repository: Repository<AuthUsers>,
  ) {
    this.hashids = new Hashids('bodhi-users', 10);
  }

  async findOne(id: number): Promise<AuthUsers> {
    return await this.repository.findOne({
      select: ['id', 'user_id', 'mobile', 'email', 'nickname', 'avatar', 'locale', 'status'],
      where: { id },
    });
  }

  async findOneByEmail(email: string): Promise<AuthUsers> {
    return await this.repository.findOne({ where: { email } });
  }

  async createOneWithEmail(email: string, opts?): Promise<AuthUsers> {
    const { nickname, avatar, locale, status = 1 } = opts || {};
    const model = this.repository.create({ email, nickname, avatar, locale, status });
    const user = await this.repository.save(model);
    // generate hash id
    user.user_id = this.hashids.encode(user.id);
    await this.repository.update(user.id, { user_id: user.user_id });

    return user;
  }
}
