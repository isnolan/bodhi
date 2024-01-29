import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanState, SubscriptionPlan } from '../entity/plan.entity';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly repository: Repository<SubscriptionPlan>,
  ) {}

  async findActive() {
    return this.repository.find({
      where: {
        status: In([PlanState.ACTIVE, PlanState.INACTIVE]),
      },
    });
  }

  public async findActiveByIds(ids: number[]) {
    return this.repository.find({
      where: {
        id: In(ids),
        status: In([PlanState.ACTIVE, PlanState.INACTIVE]),
      },
      relations: ['quotas'],
    });
  }
}
