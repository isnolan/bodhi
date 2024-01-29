import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionController } from './subscription.controller';
import Entity from './entity';
import { SubscriptionQuota } from './entity/quota.entity';
import Service, { SubscriptionService } from './service';
@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [SubscriptionController],
  providers: [...Service],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
