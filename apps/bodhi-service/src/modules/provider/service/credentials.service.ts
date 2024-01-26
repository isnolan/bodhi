import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialsState, ProviderCredentials } from '../entity';

@Injectable()
export class ProviderCredentialsService {
  constructor(
    @InjectRepository(ProviderCredentials)
    private readonly repository: Repository<ProviderCredentials>,
  ) {}
}
