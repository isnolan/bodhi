import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialState, SupplierCredentials } from '../entity/credentials.entity';

@Injectable()
export class SupplierCredentialsService {
  constructor(
    @InjectRepository(SupplierCredentials)
    private readonly repository: Repository<SupplierCredentials>,
  ) {}

  async findActiveCredential(ids: number[], conversation_id: number): Promise<SupplierCredentials> {
    return this.repository.findOne({
      where: {
        id: In(ids),
        expires_at: MoreThan(new Date()),
        status: CredentialState.ACTIVE,
      },
    });
  }

  async getInstance(id: number): Promise<SupplierCredentials> {
    return this.repository.findOne({
      select: ['id', 'ins_type', 'ins_name', 'ins_id'],
      where: {
        id,
      },
    });
  }
}
