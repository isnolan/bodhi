import Redis from 'ioredis';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { SupplierService } from '../supplier/supplier.service';
import { ChatConversationService } from './conversation.service';
import { ChatMessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatConversation } from './entity/conversation.entity';
import { QueueMessageDto } from '../supplier/dto/queue-message.dto';
import { SupplierCredentialsService } from '../supplier/service';

@Injectable()
export class ChatService {
  private readonly subscriber;

  constructor(
    @InjectQueue('chatbot')
    private readonly queue: Queue,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly supplier: SupplierService,
    private readonly credentials: SupplierCredentialsService,
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
    const { messages, message_id } = options;
    let { parent_id } = options;

    // archive message
    messages.map(async (message) => {
      const { role, parts } = message;
      const a1: CreateMessageDto = { conversation_id, message_id, user_id, role, parts, parent_id };
      const { tokens } = await this.message.save({ ...a1, parent_id });
      await this.queue.add('archives', { ...a1, tokens });
    });

    try {
      // Assign valid provisioning credentials
      const credential = await this.supplier.distributeCredential(conversation_id, conversation.credential_id);
      if (credential.id !== conversation.credential_id) {
        await this.conversation.updateAttribute(conversation.id, { credential_id: credential.id });
      }

      const s1: QueueMessageDto = { channel, model_id: credential.id, conversation_id, parent_id: message_id };
      console.log(`[chat]send`, credential, s1);
      // 发布订阅
      if (credential.ins_type === 'puppet') {
        await this.redis.publish('puppet', JSON.stringify(s1));
      }

      // 消息队列
      if (credential.ins_type === 'api') {
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

  /**
   * 自动代理
   * @param conversation
   * @param content
   * @returns
   */
  // async autoAgent(conversation: ChatConversation, channel: string, opts: any) {
  //   const { parent_id, prompt } = opts;
  //   const conversation_id = conversation.id;

  //   // 获取供应商
  //   const { id: supplierId } = await this.supplier.getInactive('gpt-3.5', 0, true); // configuration.model
  //   const supplier = (await this.supplier.get(supplierId)) as Supplier;

  //   // 存储消息:用户
  //   const message_id = uuidv4();
  //   const user_id = conversation.user_id;
  //   const a2: CreateMessageDto = { conversation_id, message_id, user_id, role: 'user', content: prompt, parent_id };
  //   Object.assign(a2, { status: 0 });
  //   const { tokens } = await this.message.save(a2);
  //   await this.queue.add('archives', { ...a2, tokens });

  //   // 加入消息发送队列
  //   const s2: QueueAgentDto = { channel, supplier_id: supplier.id, parent_id, message_id, prompt };

  //   // 消息队列
  //   const { id } = await this.queue.add('agent', s2);
  //   console.log(`[chat]agent`, id, supplier.id, supplier.provider);
  // }
}
