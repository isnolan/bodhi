import Redis from 'ioredis';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable, Inject, forwardRef } from '@nestjs/common';

import { SendMessageDto } from './dto/send-message.dto';
import { ChatConversation } from './entity/conversation.entity';
import { QueueMessageDto } from '../supplier/dto/queue-message.dto';
import { ChatConversationService, ChatMessageService } from './service';
import { CreateMessageDto } from './dto/create-message.dto';
import { InstanceType } from '../provider/entity';
import { QueueAgentDto } from '../supplier/dto/queue-agent.dto';
import { SupplierService } from '../supplier/supplier.service';

@Injectable()
export class ChatService {
  private readonly subscriber;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    @InjectRedis()
    private readonly redis: Redis,
    @Inject(forwardRef(() => SupplierService))
    private readonly supplier: SupplierService,
    private readonly message: ChatMessageService,
    private readonly configService: ConfigService,
    private readonly conversation: ChatConversationService,
  ) {
    // redis
    const option = this.configService.get('redis');
    this.subscriber = new Redis(option);
  }

  /**
   * 订阅会话消息
   * @param channel
   * @param messageListener
   */
  subscribe(channel: string, messageListener: (channel: string, message: string) => void): void {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', messageListener);
  }

  /**
   * 取消订阅会话
   * @param channel
   * @param messageListener
   */
  unsubscribe(channel: string, messageListener: (channel: string, message: string) => void): void {
    this.subscriber.unsubscribe(channel);
    this.subscriber.removeListener('message', messageListener);
  }

  /**
   * 发送消息
   * @param conversation
   * @param content
   * @returns
   */
  async send(channel: string, conversation: ChatConversation, options: SendMessageDto) {
    const { id: conversation_id, user_id } = conversation;
    const { usages, provider_ids, messages, message_id, status = 1 } = options;
    let { parent_id = '' } = options;

    // archive message
    await Promise.all(
      messages.map(async (message) => {
        const { role, parts } = message;
        const a1: CreateMessageDto = { conversation_id, message_id, user_id, role, parts, parent_id, status };
        const { tokens } = await this.message.save({ ...a1, parent_id });
        await this.queue.add('archives', { ...a1, tokens });
      }),
    );
    try {
      // Assign valid provisioning credentials
      const provider = await this.supplier.distribute(provider_ids, conversation);
      // usage
      const usage = usages.filter((u) => u.quota.providers.includes(provider.id))[0];
      // console.log(`[chat]distribute`, provider.id, usage.id);
      if (provider.id !== conversation.provider_id) {
        await this.conversation.updateAttribute(conversation.id, { provider_id: provider.id, usage_id: usage.id });
      }

      const s1: QueueMessageDto = { channel, provider_id: provider.id, conversation_id, parent_id: message_id, status };
      // console.log(`[chat]send`, provider, s1);
      if (provider.instance.type === InstanceType.SESSION) {
        await this.redis.publish('puppet', JSON.stringify(s1));
      }

      if (provider.instance.type === InstanceType.API) {
        await this.queue.add('openapi', s1, { priority: 1, delay: 10 });
      }
    } catch (err) {
      this.reply(channel, { error: { message: err.message, code: 400 } });
    }
  }

  /**
   * 回复消息
   * @param conversationId
   * @param event
   * @param payload
   * @returns
   */
  async reply(channel: string, payload: any) {
    // console.log(`[chat]reply`, channel, payload);
    await this.redis.publish(channel, JSON.stringify(payload));
  }
}
