import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SupplierService } from './supplier.service';
import { Supplier } from './entity/supplier.entity';

import { ChatModule } from '../chat/chat.module';
import { FilesModule } from '../files/files.module';
import { SupplierModels } from './entity/models.entity';
import { SupplierPuppetProcessor } from './puppet.processor';
import { SupplierModelsService } from './models.service';
import { SupplierOpenAPIProcessor } from './openapi.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, SupplierModels]),

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
    forwardRef(() => FilesModule),
  ],
  controllers: [],
  providers: [SupplierService, SupplierModelsService, SupplierPuppetProcessor, SupplierOpenAPIProcessor],
  exports: [SupplierService, SupplierModelsService],
})
export class SupplierModule {}
