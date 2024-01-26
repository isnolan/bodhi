import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderInstance } from '../entity';

@Injectable()
export class ProviderInstanceService {
  constructor(
    @InjectRepository(ProviderInstance)
    private readonly repository: Repository<ProviderInstance>,
  ) {}
}
