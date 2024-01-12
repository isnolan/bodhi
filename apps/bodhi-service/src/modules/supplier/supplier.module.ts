import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SupplierService } from './supplier.service';
import { Supplier } from './entity/supplier.entity';

import { SupplierOpenAIProcessor } from './openai.processor';
import { SupplierPuppetProcessor } from './puppet.processor';
import { ChatModule } from '../chat/chat.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier]),

    // Redis Queue
    BullModule.registerQueueAsync({
      name: 'chatbot',
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: config.get('redis'),
        defaultJobOptions: { attempts: 2, removeOnComplete: true, removeOnFail: true },
      }),
    }),

    forwardRef(() => ChatModule),
    forwardRef(() => FileModule),
  ],
  controllers: [],
  providers: [SupplierService, SupplierOpenAIProcessor, SupplierPuppetProcessor],
  exports: [SupplierService],
})
export class SupplierModule {}
