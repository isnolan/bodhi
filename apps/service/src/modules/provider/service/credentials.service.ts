import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { CredentialsState, ProviderCredentials } from '../entity';

@Injectable()
export class ProviderCredentialsService {
  constructor(
    @InjectRepository(ProviderCredentials)
    private readonly repository: Repository<ProviderCredentials>,
  ) {}

  async create(payload: Partial<ProviderCredentials>) {
    return await this.repository.save(payload);
  }

  async findByUserId(user_id: number): Promise<ProviderCredentials[]> {
    return this.repository.find({
      select: ['id', 'type', 'label', 'authorisation', 'expires_at', 'create_at', 'update_at'],
      where: { user_id, status: MoreThanOrEqual(0) },
    });
  }

  async updateState(id: number, state: CredentialsState) {
    return await this.repository.update(id, { status: state });
  }
}
