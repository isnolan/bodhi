import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SupplierService } from './supplier.service';

import { ChatModule } from '../chat/chat.module';
import { FilesModule } from '../files/files.module';
import Entity from './entity';
import Service, { SupplierCredentialsService, SupplierPurchasedService } from './service/';
import { ProviderModule } from '../provider/provider.module';
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

    forwardRef(() => ChatModule),
    forwardRef(() => FilesModule),

    ProviderModule,
  ],
  controllers: [],
  providers: [SupplierService, ...Service],
  exports: [SupplierService, SupplierPurchasedService, SupplierCredentialsService],
})
export class SupplierModule {}
