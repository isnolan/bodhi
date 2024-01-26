import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In, MoreThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
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
      select: ['id', 'type', 'label', 'authorisation', 'expires_at', 'create_time', 'update_time'],
      where: { user_id, status: MoreThanOrEqual(0) },
    });
  }
}
