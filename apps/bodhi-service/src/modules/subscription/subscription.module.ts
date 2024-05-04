import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import Entity from './entity';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SubscriptionProcessService } from './process/subscription.process';
import Service from './service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([...Entity]),
    // Redis Queue
    BullModule.registerQueueAsync({
      name: 'bodhi',
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: config.get('redis'),
        defaultJobOptions: { attempts: 2, removeOnComplete: true, removeOnFail: true },
      }),
    }),
    UsersModule,
  ],
  controllers: [SubscriptionController],
  providers: [...Service, SubscriptionService, SubscriptionGuard, SubscriptionProcessService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
