import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderCredentials } from '../entity';

@Injectable()
export class ProviderCredentialsService {
  constructor(
    @InjectRepository(ProviderCredentials)
    private readonly repository: Repository<ProviderCredentials>,
  ) {}
}
