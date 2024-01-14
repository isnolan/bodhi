import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthKeys, AuthKeysState } from '../entity';

@Injectable()
export class AuthKeysService {
  constructor(
    @InjectRepository(AuthKeys)
    private readonly repository: Repository<AuthKeys>,
  ) {}

  /**
   * Create a new secret key
   * @returns
   */
  async create(user_id: number, opts: Partial<AuthKeys>): Promise<AuthKeys> {
    const { foreign_id = '', note = '' } = opts;
    const secret_key = `sk-` + uuidv4();
    const model = this.repository.create({ user_id, secret_key, foreign_id, note });
    return await this.repository.save(model);
  }

  /**
   * Find a secret key
   * @param secret_key
   * @returns
   */
  async validateKey(secret_key: string): Promise<AuthKeys> {
    const keys = await this.repository.findOne({ where: { secret_key, state: AuthKeysState.VALID } });
    if (keys && (!keys.expire_at || keys.expire_at > new Date())) {
      return keys;
    }
    return null;
  }
}
