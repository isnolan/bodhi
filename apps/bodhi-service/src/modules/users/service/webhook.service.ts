import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';

import { UserWebhook, WebhookState } from '../entity';

@Injectable()
export class UserWebhookService {
  constructor(
    @InjectRepository(UserWebhook)
    private readonly repository: Repository<UserWebhook>,
  ) {}

  async create(user_id: number, opts: Partial<UserWebhook>): Promise<UserWebhook> {
    return this.repository.save(this.repository.create({ user_id, ...opts }));
  }

  async findActive(user_id: number): Promise<UserWebhook[]> {
    const query = { user_id, state: WebhookState.VALID };
    return this.repository.find({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
  }

  async delete(id: number) {
    return this.repository.update(id, { state: WebhookState.DELETED });
  }
}
