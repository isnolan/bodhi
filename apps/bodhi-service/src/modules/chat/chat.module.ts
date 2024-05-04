import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProviderModule } from '../provider/provider.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SupplierModule } from '../supplier/supplier.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatConversation } from './entity/conversation.entity';
import { ChatMessage } from './entity/message.entity';
import Service from './service';

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

    SubscriptionModule,

    UsersModule,
  ],

  controllers: [ChatController],
  providers: [ChatService, ...Service],
  exports: [ChatService],
})
export class ChatModule {}
