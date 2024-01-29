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

  async findInActive() {
    return this.repository.find({
      where: {
        status: In([PlanState.ACTIVE, PlanState.INACTIVE]),
      },
    });
  }
}
