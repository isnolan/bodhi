import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SubscriptionUsage } from '../entity';

@Injectable()
export class SubscriptionUsageService {
  constructor(
    @InjectRepository(SubscriptionUsage)
    private readonly repository: Repository<SubscriptionUsage>,
  ) {}
}
