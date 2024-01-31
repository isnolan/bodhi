import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Process, Processor, OnGlobalQueueCompleted } from '@nestjs/bull';

import { QueueMessageDto } from '../dto/queue-message.dto';
import { CreateMessageDto } from '@/modules/chat/dto/create-message.dto';

import { ChatService } from '@/modules/chat/chat.service';
import { ChatConversationService, ChatMessageService } from '@/modules/chat/service';
import { Inject, forwardRef } from '@nestjs/common';
import { ProviderService } from '@/modules/provider/service';
import { KeyAuthorisation } from '@/modules/provider/entity';
import { QueueAgentDto } from '../dto/queue-agent.dto';
import { ChatMessage } from '@/modules/chat/entity/message.entity';

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
  ) {}

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
          this.queue.add('archives', { parent_id, ...payload, tokens: 0 });
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

  @Process('agent')
  async subject(job: Job<QueueAgentDto>) {
    // console.log(`[api]job:`, job.data);
    const { channel, provider_id, parent_id, message_id, message } = job.data;
    return new Promise(async (resolve) => {
      try {
        const provider = (await this.provider.findActive([provider_id]))[0];
        const { ChatAPI } = await importDynamic('@isnolan/bodhi-adapter');
        const { authorisation } = provider.credential;
        const api = new ChatAPI(provider.instance.name, {
          apiKey: (authorisation as KeyAuthorisation).api_key,
          apiSecret: (authorisation as KeyAuthorisation).api_secret,
          agent: process.env.HTTP_PROXY,
        });
        const latest = await this.message.findMyMessageId(parent_id);
        // console.log(`-->`, [...latest.parts, ...message.parts]);
        const res = await api.sendMessage({
          messages: [message],
          model: provider.model.name,
        });

        const parts = res.choices[0].parts;
        const tokens = res.usage?.completion_tokens;
        console.log(`[agent]`, channel, new Date().toLocaleTimeString('zh-CN'));
        console.log(`->`, parts);

        await this.service.reply(channel, res);

        // ready to archives
        const payload = { conversation_id: latest.conversation_id, message_id: res.id, role: 'assistant', parts };
        Object.assign(payload, { tokens, status: 0, parent_id: message_id });
        await this.queue.add('archives', payload);

        resolve({});
      } catch (err) {
        console.warn(`[api]`, err.code, err.message);
        this.service.reply(channel, { error: { message: err.message, code: err.code } });
        resolve({});
        return;
      }
    });
  }

  @OnGlobalQueueCompleted()
  async onGlobalCompleted(jobId: number) {
    console.log(`[openapi]Queue process completed`, jobId);
  }
}
