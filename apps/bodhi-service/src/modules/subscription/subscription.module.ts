import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import Entity from './entity';
import Service, { SubscriptionService } from './service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsersModule } from '../users/users.module';
@Module({
  imports: [TypeOrmModule.forFeature([...Entity]), UsersModule],
  controllers: [SubscriptionController],
  providers: [...Service, SubscriptionGuard],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
