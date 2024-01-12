import Redis from 'ioredis';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { SupplierService } from '../supplier/supplier.service';
import { ChatConversationService } from './conversation.service';
import { ChatMessageService } from './message.service';
import { Supplier } from '../supplier/entity/supplier.entity';
import { QueueMessageDto } from './dto/queue-message.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueueAgentDto } from './dto/queue-agent.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatConversation } from './entity/conversation.entity';

@Injectable()
export class ChatService {
  private readonly subscriber;

  constructor(
    @InjectQueue('chatbot')
    private readonly queue: Queue,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly conversation: ChatConversationService,
    private readonly message: ChatMessageService,
    private readonly supplier: SupplierService,
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
  async send(conversation: ChatConversation, options: SendMessageDto, channel: string) {
    const { id: conversation_id, user_id, model } = conversation;
    const { prompt, system_prompt, attachments, n, message_id = '' } = options;
    let { parent_id } = options;

    // 存储消息:系统
    if (conversation.supplier_id === 0 && system_prompt) {
      parent_id = uuidv4();
      const a1: CreateMessageDto = { conversation_id, message_id: parent_id, role: 'system', content: system_prompt };
      const { tokens } = await this.message.save({ ...a1, parent_id: '' });
      console.log(`[chat]send:system`, a1, tokens);
      await this.queue.add('archives', { ...a1, tokens });
    }

    // 存储消息:用户
    const a2: CreateMessageDto = { conversation_id, message_id, user_id, role: 'user', content: prompt, attachments };
    const { tokens } = await this.message.save({ ...a2, parent_id });
    await this.queue.add('archives', { ...a2, tokens }, { delay: 200 });

    // 获取是否已分配节点
    let supplier: Supplier;
    if (conversation.supplier_id !== 0) {
      // 获取节点类型
      supplier = (await this.supplier.get(conversation.supplier_id)) as Supplier;
      // 若Puppet节点，则续期占用
      if (supplier.instance === 'puppet') {
        // 检查节点是否占用
        const inServerConversationId = await this.supplier.CheckInService(supplier.id);
        if (!inServerConversationId || inServerConversationId === conversation.id) {
          // 续期
          await this.supplier.RenewalProvider(supplier.id, conversation.id, 180);
          console.log(`[chat]send:cache`, supplier.id);
        } else {
          // 降级
          supplier = await this.supplier.getInactive(model, conversation.id, true); // Draft-LM-3L4K
          await this.conversation.updateSupplier(conversation.id, supplier.id);
          console.log(`[chat]send:downgrade`, supplier.id);
        }
      }
    } else {
      // 分配节点
      try {
        supplier = await this.supplier.getInactive(model, conversation.id); // Draft-LM-3L4K
        console.log(`[chat]send:supplier`, supplier.id);
      } catch (err) {
        console.warn(err);
        this.reply(channel, { role: 'assistant', content: 'No available suppliers yet' });
        return;
      }
      await this.conversation.updateSupplier(conversation.id, supplier.id);
      console.log(`[socket]conversation:inactive`, supplier.id);
    }

    // 加入消息发送队列
    const supplier_id = supplier.id;
    const s1: QueueMessageDto = { channel, supplier_id, conversation_id, content: prompt, parent_id: message_id };
    Object.assign(s1, { attachments });
    if (supplier.instance === 'puppet') {
      // 发布订阅
      await this.redis.publish('puppet', JSON.stringify(s1));
    } else {
      // 消息队列
      await this.queue.add('openapi', s1, { priority: 1, delay: 10 });
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
    console.log(`[chat]reply`, channel, payload);
    await this.redis.publish(channel, JSON.stringify(payload));
  }

  /**
   * 自动代理
   * @param conversation
   * @param content
   * @returns
   */
  async autoAgent(conversation: ChatConversation, channel: string, opts: any) {
    const { parent_id, prompt } = opts;
    const conversation_id = conversation.id;

    // 获取供应商
    const { id: supplierId } = await this.supplier.getInactive('gpt-3.5', 0, true); // configuration.model
    const supplier = (await this.supplier.get(supplierId)) as Supplier;

    // 存储消息:用户
    const message_id = uuidv4();
    const user_id = conversation.user_id;
    const a2: CreateMessageDto = { conversation_id, message_id, user_id, role: 'user', content: prompt, parent_id };
    Object.assign(a2, { status: 0 });
    const { tokens } = await this.message.save(a2);
    await this.queue.add('archives', { ...a2, tokens });

    // 加入消息发送队列
    const s2: QueueAgentDto = { channel, supplier_id: supplier.id, parent_id, message_id, prompt };

    // 消息队列
    const { id } = await this.queue.add('agent', s2);
    console.log(`[chat]agent`, id, supplier.id, supplier.provider);
  }
}
