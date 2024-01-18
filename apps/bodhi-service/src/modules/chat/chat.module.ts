import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SupplierModule } from '../supplier/supplier.module';
import { ChatConversationService } from './conversation.service';
import { ChatMessageService } from './message.service';
import { ChatConversation } from './entity/conversation.entity';
import { ChatMessage } from './entity/message.entity';
@Module({
  imports: [
    // MySQL
    TypeOrmModule.forFeature([ChatConversation, ChatMessage]),

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

    forwardRef(() => SupplierModule),
  ],

  controllers: [ChatController],
  providers: [ChatService, ChatConversationService, ChatMessageService],
  exports: [ChatService, ChatConversationService, ChatMessageService],
})
export class ChatModule {}
