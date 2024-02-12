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

  async findSimpleList() {
    return await this.repository.find({
      select: ['id', 'title', 'description'],
      where: { status: In([PlanState.ACTIVE, PlanState.INACTIVE]) },
      order: { id: 'ASC' },
    });
  }

  async findActive() {
    return this.repository.find({
      select: ['id', 'title', 'description', 'price', 'annual_price'],
      where: {
        status: In([PlanState.ACTIVE]),
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
