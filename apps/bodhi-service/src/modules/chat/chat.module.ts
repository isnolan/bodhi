import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SupplierModule } from '../supplier/supplier.module';
import { ChatConversation } from './entity/conversation.entity';
import { ChatMessage } from './entity/message.entity';
import Service from './service';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [
    // MySQL
    TypeOrmModule.forFeature([ChatConversation, ChatMessage]),

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

    forwardRef(() => SupplierModule),
    ProviderModule,
  ],

  controllers: [ChatController],
  providers: [ChatService, ...Service],
  exports: [ChatService, ...Service],
})
export class ChatModule {}
