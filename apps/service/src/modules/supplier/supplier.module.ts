import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ChatModule } from '../chat/chat.module';
import { FilesModule } from '../files/files.module';
import { ProviderModule } from '../provider/provider.module';
import { UsersModule } from '../users/users.module';
import Service from './service';
import { SupplierService } from './supplier.service';
@Module({
  imports: [
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
    ProviderModule,

    forwardRef(() => ChatModule),
    forwardRef(() => FilesModule),
  ],
  controllers: [],
  providers: [SupplierService, ...Service],
  exports: [SupplierService],
})
export class SupplierModule {}
