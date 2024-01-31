import Hashids from 'hashids/cjs';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';

@Injectable()
export class UsersService {
  private readonly hashids: Hashids;

  constructor(
    @InjectRepository(Users)
    private readonly repository: Repository<Users>,
  ) {
    this.hashids = new Hashids('bodhi-users', 10);
  }

  async findOne(id: number): Promise<Users> {
    return await this.repository.findOne({
      select: ['id', 'user_id', 'mobile', 'email', 'nickname', 'avatar', 'locale', 'timezone', 'status'],
      where: { id },
    });
  }

  async findOneByEmail(email: string): Promise<Users> {
    return await this.repository.findOne({ where: { email } });
  }

  async createOneWithEmail(email: string, opts: Partial<Users>): Promise<Users> {
    const { nickname, avatar, locale, status = 1 } = opts || {};
    const model = this.repository.create({ email, nickname, avatar, locale, status });
    const user = await this.repository.save(model);
    // generate hash id
    user.user_id = this.hashids.encode(user.id);
    await this.repository.update(user.id, { user_id: user.user_id });

    return user;
  }
}
