import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Process, Processor, OnGlobalQueueCompleted } from '@nestjs/bull';

import { QueueMessageDto } from '../dto/queue-message.dto';
// import { CreateMessageDto } from '@/modules/chat/dto/create-message.dto';

import { ChatService } from '@/modules/chat/chat.service';
import { ChatConversationService, ChatMessageService } from '@/modules/chat/service';
import { Inject, forwardRef } from '@nestjs/common';
import { ProviderService } from '@/modules/provider/service';
import { KeyAuthorisation } from '@/modules/provider/entity';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

@Processor('bodhi')
export class SupplierOpenAPIProcessor {
  private apis: any;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    @Inject(forwardRef(() => ChatService))
    private readonly service: ChatService,
    @Inject(forwardRef(() => ChatMessageService))
    private readonly message: ChatMessageService,
    @Inject(forwardRef(() => ChatConversationService))
    private readonly conversation: ChatConversationService,
    private readonly provider: ProviderService,
  ) {
    this.initAPI();
  }

  /**
   * 初始化 OpenAI 节点
   */
  async initAPI() {
    this.apis = await importDynamic('@isnolan/bodhi-adapter');
  }

  /**
   * Bodhi API Process
   */
  @Process('openapi')
  async openai(job: Job<QueueMessageDto>) {
    console.log(`[api]job:`, job.data);
    const { channel, provider_id, conversation_id, parent_id } = job.data;
    return new Promise(async (resolve) => {
      try {
        const provider = (await this.provider.findActive([provider_id]))[0];
        const conversation = await this.conversation.findOne(conversation_id);

        const { ChatAPI } = await importDynamic('@isnolan/bodhi-adapter');
        const { authorisation } = provider.credential;
        const api = new ChatAPI(provider.instance.name, {
          apiKey: (authorisation as KeyAuthorisation).api_key,
          apiSecret: (authorisation as KeyAuthorisation).api_secret,
          agent: process.env.HTTP_PROXY,
        });
        const messages = await this.message.getLastMessages(conversation_id, conversation.context_limit);
        const res = await api.sendMessage({
          messages: [...messages],
          model: provider.model.name,
          temperature: Number(conversation.temperature),
          top_p: Number(conversation.top_p),
          top_k: Number(conversation.top_k),
          n: conversation.n,
          onProgress: (choices) => {
            console.log(`[api]progress`, provider_id, provider.model.name, new Date().toLocaleTimeString('zh-CN'));
            choices.forEach((row: any, idx: number) => {
              console.log(`->idx:`, idx, row.parts);
            });
            this.service.reply(channel, choices);
          },
        });

        // archive
        res.choices.map((row: any) => {
          const payload = { conversation_id, role: row.role, parts: row.parts, message_id: res.id };
          this.queue.add('archives', { parent_id, ...payload });
        });

        // 回复会话
        this.service.reply(channel, { conversation_id: conversation.conversation_id, ...res });

        resolve({});
      } catch (err) {
        console.warn(`[api]`, err.code, err.message);
        this.service.reply(channel, { error: { message: err.message, code: err.code } });
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
  // @Process('archives')
  // async archives(job: Job<CreateMessageDto>) {
  //   // console.log(`[archives]job:`, job.data);
  //   const { conversation_id, role, parts, message_id }: CreateMessageDto = job.data; // 必备
  //   const { parent_conversation_id, parent_id, status }: any = job.data; // 可选
  //   return new Promise(async (resolve) => {
  //     // 储存信息, system 和 user 在第一时间入库，以便于api发送消息时能够查询到最新消息列表。
  //     if (role === 'assistant') {
  //       const d3 = { conversation_id, role, parts, message_id, parent_id, status };
  //       await this.message.save(d3);
  //     }

  //     // 更新会话
  //     const tokens = await this.message.getTokensByConversationId(conversation_id);
  //     const attr = { tokens };
  //     parent_conversation_id && Object.assign(attr, { parent_conversation_id });
  //     await this.conversation.updateAttribute(conversation_id, attr);
  //     resolve({});
  //   });
  // }

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
