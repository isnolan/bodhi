import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProviderInstance } from '../entity';

@Injectable()
export class ProviderInstanceService {
  constructor(
    @InjectRepository(ProviderInstance)
    private readonly repository: Repository<ProviderInstance>,
  ) {}
}
