import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Process, Processor, OnGlobalQueueCompleted } from '@nestjs/bull';

import { SupplierService } from './supplier.service';
import { Supplier } from '../supplier/entity/supplier.entity';
import { ChatConversationService } from '../chat/conversation.service';
import { ChatMessageService } from '../chat/message.service';
import { ChatService } from '../chat/chat.service';
import { QueueMessageDto } from '../chat/dto/queue-message.dto';
import { CreateMessageDto } from '../chat/dto/create-message.dto';
import { QueueAgentDto } from '../chat/dto/queue-agent.dto';
import { ChatConversation } from '../chat/entity/conversation.entity';
import { ChatMessage } from '../chat/entity/message.entity';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

@Processor('chatbot')
export class SupplierOpenAIProcessor {
  private readonly proxy: any;
  private apis: any;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue('chatbot')
    private readonly queue: Queue,
    private readonly supplier: SupplierService,

    private readonly service: ChatService,
    private readonly message: ChatMessageService,
    private readonly conversation: ChatConversationService,
  ) {
    this.proxy = config.get('proxy');
    this.apis = {};
  }

  /**
   * 初始化 OpenAI 节点
   */
  async initAPI(supplier: Supplier) {
    if (this.apis[supplier.id]) {
      return this.apis[supplier.id];
    }

    const { ChatGPTAPI, AzureChatGPTAPI } = await importDynamic('@yhostc/chatbot-puppet');
    const { apiKey } = JSON.parse(supplier.authorisation);
    if (supplier.provider === 'openai') {
      this.apis[supplier.id] = new ChatGPTAPI({ apiKey, proxyAgent: process.env.PROXY_AGENT });
    }
    if (supplier.provider === 'azure') {
      this.apis[supplier.id] = new AzureChatGPTAPI({ apiKey });
    }

    return this.apis[supplier.id];
  }

  /**
   * OpenAPI Process
   */
  @Process('openapi')
  async openai(job: Job<QueueMessageDto>) {
    // console.log(`[api]job:`, job.data);
    // Get Local Conversation and Message ID
    const { channel, supplier_id, conversation_id, parent_id } = job.data;

    return new Promise(async (resolve) => {
      // 获取供应商信息
      try {
        const supplier = (await this.supplier.get(supplier_id)) as Supplier;
        const conversation = (await this.conversation.findOne(conversation_id)) as ChatConversation;
        const { model } = supplier;
        const completionParams = {
          model,
          n: Number(conversation.n),
          temperature: Number(conversation.temperature),
          // presence_penalty: Number(conversation.presence_penalty),
          // frequency_penalty: Number(conversation.frequency_penalty),
        };
        const messages = await this.message.getLastMessages(conversation_id, conversation.context_limit);
        const api = await this.initAPI(supplier);
        const res = await api.sendMessage(messages, {
          onProgress: ({ choices }: any) => {
            console.log(`[${supplier.provider}]progress`, supplier_id, model, new Date().toLocaleTimeString('zh-CN'));
            // multiple choice
            choices.forEach((row: any, idx: number) => {
              console.log(`->idx:`, idx, row.message.content);
            });
            this.service.reply(channel, choices);
          },
          completionParams,
        });

        // 封存消息
        res.choices.forEach((row: any) => {
          const { content } = row.message;
          const payload = { conversation_id, role: 'assistant', content, message_id: res.id };
          Object.assign(payload, { parent_id });
          // ready to archives
          this.queue.add('archives', { ...payload });
        });

        // 回复会话
        this.service.reply(channel, { conversation_id: conversation.conversation_id, ...res });

        resolve({});
      } catch (err) {
        console.warn(`[api]`, err);
        this.service.reply(channel, err.message);
        resolve({});
        return;
      }
    });
  }

  // @Process('agent')
  // async subject(job: Job<QueueAgentDto>) {
  //   // console.log(`[api]job:`, job.data);
  //   const { channel, supplier_id, parent_id, message_id, prompt } = job.data;
  //   return new Promise(async (resolve) => {
  //     try {
  //       const supplier = (await this.supplier.get(supplier_id)) as Supplier;
  //       const { ChatGPTAPI, AzureChatGPTAPI } = await importDynamic('@yhostc/chatbot-puppet');
  //       const { apiKey } = JSON.parse(supplier.authorisation);
  //       const opts = { apiKey, proxyAgent: process.env.PROXY_AGENT };
  //       const api = supplier.provider == 'openai' ? new ChatGPTAPI(opts) : new AzureChatGPTAPI(opts);

  //       const message = (await this.message.findMyMessageId(parent_id)) as ChatMessage;
  //       const res = await api.sendMessage([
  //         { role: 'system', content: prompt },
  //         { role: 'user', content: message.content },
  //       ]);

  //       const content = res.choices[0].message.content;
  //       const tokens = res.usage?.completion_tokens;
  //       console.log(`[agent]`, channel, new Date().toLocaleTimeString('zh-CN'));
  //       console.log(`->`, content);

  //       await this.service.reply(channel, res);

  //       // ready to archives
  //       const payload = { conversation_id: message.conversation_id, message_id: res.id, role: 'assistant', content };
  //       Object.assign(payload, { tokens, status: 0, parent_id: message_id });
  //       await this.queue.add('archives', payload);

  //       resolve({});
  //     } catch (err) {
  //       console.warn(`[agent]Error`, err.message);
  //       resolve({});
  //       return;
  //     }
  //   });
  // }

  /**
   * Archives
   */
  @Process('archives')
  async archives(job: Job<CreateMessageDto>) {
    // console.log(`[archives]job:`, job.data);
    const { conversation_id, role, parts, message_id }: CreateMessageDto = job.data; // 必备
    const { parent_conversation_id, parent_id, status }: any = job.data; // 可选
    return new Promise(async (resolve) => {
      // 储存信息, system 和 user 在第一时间入库，以便于api发送消息时能够查询到最新消息列表。
      if (role === 'assistant') {
        const d3 = { conversation_id, role, parts, message_id, parent_id, status };
        await this.message.save(d3);
      }

      // 更新会话
      const tokens = await this.message.getTokensByConversationId(conversation_id);
      const attr = { tokens };
      if (parent_conversation_id) {
        Object.assign(attr, { parent_conversation_id });
      }
      await this.conversation.updateAttribute(conversation_id, attr);

      resolve({});
    });
  }

  /**
   * 任务完成
   * @param jobId
   * @param result
   */
  @OnGlobalQueueCompleted()
  async onGlobalCompleted(jobId: number) {
    console.log('Job completed:', jobId);
  }
}
