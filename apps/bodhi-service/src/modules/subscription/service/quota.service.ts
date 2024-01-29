import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionQuota } from '../entity/quota.entity';

@Injectable()
export class SubscriptionQuotaService {
  constructor(
    @InjectRepository(SubscriptionQuota)
    private readonly repository: Repository<SubscriptionQuota>,
  ) {}

  async findQuotasByPlanId(plan_id: number): Promise<SubscriptionQuota[]> {
    return this.repository.find({
      where: { plan_id },
    });
  }
}
