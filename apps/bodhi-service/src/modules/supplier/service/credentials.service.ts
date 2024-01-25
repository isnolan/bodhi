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

  async findActive(ids: number[]): Promise<SupplierCredentials[]> {
    return this.repository.find({
      where: { id: In(ids), expires_at: MoreThan(new Date()), status: CredentialState.ACTIVE },
    });
  }
}
