/* eslint max-params: */
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { InjectQueue } from '@nestjs/bull';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import Redis from 'ioredis';

import { InstanceType } from '../provider/entity';
import { QueueMessageDto } from '../supplier/dto/queue-message.dto';
import { SupplierService } from '../supplier/supplier.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatConversation } from './entity/conversation.entity';
import { ChatMessage } from './entity/message.entity';
import { ChatConversationService, ChatMessageService } from './service';

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

  async updateProviderByConversationId(id: number, provider_id: number) {
    return this.conversation.updateAttribute(id, { provider_id });
  }

  async findConversation(id: number) {
    return this.conversation.findOne(id);
  }

  async findLastMessageByConversationId(conversation_id: number) {
    return this.message.findLastMessage(conversation_id);
  }

  async findLastMessagesByConversationId(conversation_id: number, context_limit = 5, status = 1) {
    return this.message.findLastMessages(conversation_id, context_limit, status);
  }

  async updateConversationAttr(id: number, attr: any) {
    return this.conversation.updateAttribute(id, attr);
  }

  async createMessage(opts: Partial<ChatMessage>) {
    return this.message.save(opts);
  }

  async getTokensByConversationId(conversation_id: number) {
    return this.message.getTokensByConversationId(conversation_id);
  }

  /**
   * 发送消息
   * @param conversation
   * @param content
   * @returns
   */
  async completion(channel: string, conversation: ChatConversation, options: SendMessageDto) {
    const { id: conversation_id, user_id } = conversation;
    const { usages, provider_ids, messages, message_id, status = 1 } = options;
    const { parent_id = '' } = options;
    // archive message
    await Promise.all(
      messages.map(async (message) => {
        const { role, parts } = message;
        const a1: CreateMessageDto = { conversation_id, message_id, user_id, role, parts, parent_id, status };
        const { tokens } = await this.message.save({ ...a1, parent_id });
        this.queue.add('archives', { ...a1, tokens });
      }),
    );

    try {
      // Assign valid provisioning credentials
      const provider = await this.supplier.distribute(provider_ids, conversation);
      // usage
      const usage = usages.filter((u) => u.quota.providers.includes(provider.id))[0];
      // console.log(`[chat]distribute`, provider.id, usage.id);
      if (provider.id !== conversation.provider_id) {
        this.conversation.updateAttribute(conversation.id, { provider_id: provider.id, usage_id: usage.id });
      }

      const s1: QueueMessageDto = { channel, provider_id: provider.id, conversation_id, parent_id: message_id, status };
      // console.log(`[chat]send`, provider, s1);
      if (provider.instance.type === InstanceType.SESSION) {
        await this.redis.publish('puppet', JSON.stringify({ ...s1, provider_ids }));
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
