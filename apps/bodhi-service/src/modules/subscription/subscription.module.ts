import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import Entity from './entity';
import Service from './service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsersModule } from '../users/users.module';
import { SubscriptionService } from './subscription.service';
import { SubscriptionProcessService } from './process/subscription.process';
@Module({
  imports: [TypeOrmModule.forFeature([...Entity]), UsersModule],
  controllers: [SubscriptionController],
  providers: [...Service, SubscriptionService, SubscriptionGuard, SubscriptionProcessService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
