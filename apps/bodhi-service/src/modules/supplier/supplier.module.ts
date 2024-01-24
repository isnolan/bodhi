import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SupplierService } from './supplier.service';

import { ChatModule } from '../chat/chat.module';
import { FilesModule } from '../files/files.module';
import { SupplierModels } from './entity/models.entity';
import Service, { SupplierPurchasedService } from './service/';
import { SupplierPurchased } from './entity/purchased.entity';
import { SupplierCredentials } from './entity/credentials.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierModels, SupplierPurchased, SupplierCredentials]),

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
  providers: [SupplierService, ...Service],
  exports: [SupplierService, SupplierPurchasedService],
})
export class SupplierModule {}
