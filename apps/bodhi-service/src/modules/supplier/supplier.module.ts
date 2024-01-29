import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ChatModule } from '../chat/chat.module';
import { FilesModule } from '../files/files.module';
import Service, { SupplierService } from './service/';
import { ProviderModule } from '../provider/provider.module';
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

    forwardRef(() => ChatModule),
    forwardRef(() => FilesModule),

    ProviderModule,
  ],
  controllers: [],
  providers: [...Service],
  exports: [SupplierService],
})
export class SupplierModule {}
