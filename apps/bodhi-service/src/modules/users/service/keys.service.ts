import { v4 as uuidv4 } from 'uuid';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserKey, UserKeyState } from '../entity/keys.entity';

@Injectable()
export class UserKeyService {
  constructor(
    @InjectRepository(UserKey)
    private readonly repository: Repository<UserKey>,
  ) {}

  /**
   * Validate api key, when request by api key.
   * @param secret_key
   * @returns
   */
  async validateKey(secret_key: string): Promise<UserKey> {
    const query = { secret_key, state: UserKeyState.VALID };
    const keys = await this.repository.findOne({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
    if (keys) {
      // update last used time
      this.repository.update(keys.id, { update_at: moment.utc().toDate() });
      return keys;
    }
    return null;
  }

  async findActive(user_id: number, client_user_id: string): Promise<UserKey> {
    return this.repository.findOne({ where: { user_id, client_user_id, state: UserKeyState.VALID } });
  }

  /**
   * Create a new secret key
   * @returns
   */
  async createKey(user_id: number, opts: Partial<UserKey>): Promise<UserKey> {
    const { client_user_id } = opts;
    const exist = await this.repository.findOne({ where: { user_id, client_user_id, state: UserKeyState.VALID } });
    if (exist) {
      return exist;
    }

    // create a new secret key
    const secret_key = `sk-` + uuidv4();
    return this.repository.save(this.repository.create({ user_id, ...opts, secret_key }));
  }

  async getList(user_id: number): Promise<UserKey[]> {
    return this.repository.find({
      select: ['id', 'client_user_id', 'secret_key', 'remark', 'expires_at', 'update_at'],
      where: { user_id },
    });
  }

  async delete(id: number) {
    return this.repository.update(id, { state: UserKeyState.DELETED });
  }
}
