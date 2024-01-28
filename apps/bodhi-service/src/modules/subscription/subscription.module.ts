import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionPlan } from './entity/plan.entity';
import { SubscriptionQuota } from './entity/quota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, SubscriptionQuota])],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
