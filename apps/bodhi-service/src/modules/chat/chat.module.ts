import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesModule } from '../files/files.module';
import { ProviderModule } from '../provider/provider.module';
import { SupplierModule } from '../supplier/supplier.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import Entity from './entity';
import Service from './service';

@Module({
  imports: [
    // MySQL
    TypeOrmModule.forFeature(Entity),

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
    forwardRef(() => SupplierModule),
    ProviderModule,

    FilesModule,
  ],

  controllers: [ChatController],
  providers: [ChatService, ...Service],
  exports: [ChatService],
})
export class ChatModule {}
