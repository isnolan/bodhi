import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Process, Processor } from '@nestjs/bull';

import { QueueMessageDto } from '../dto/queue-message.dto';
import { ChatService } from '@/modules/chat/chat.service';
import { ChatConversationService, ChatMessageService } from '@/modules/chat/service';
import { Inject, forwardRef } from '@nestjs/common';
import { ProviderService } from '@/modules/provider/service';
import { KeyAuthorisation } from '@/modules/provider/entity';
import { QueueAgentDto } from '../dto/queue-agent.dto';

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

  async initAPI() {
    if (this.apis) {
      return this.apis;
    }

    this.apis = await importDynamic('@isnolan/bodhi-adapter');
    return this.apis;
  }

  /**
   * Bodhi API Process
   */
  @Process('openapi')
  async openai(job: Job<QueueMessageDto>) {
    console.log(`[api]job:`, job.data);

    const { channel, provider_id, conversation_id, parent_id, status = 1 } = job.data;
    return new Promise(async (resolve) => {
      try {
        const provider = (await this.provider.findActive([provider_id]))[0];

        const conversation = await this.conversation.findOne(conversation_id);
        const { ChatAPI } = await this.initAPI();
        const { authorisation } = provider.credential;
        const api = new ChatAPI(provider.instance.name, {
          apiKey: (authorisation as KeyAuthorisation).api_key,
          apiSecret: (authorisation as KeyAuthorisation).api_secret,
          agent: process.env.HTTP_PROXY,
        });

        const messages = await this.message.getLastMessages(conversation_id, conversation.context_limit, status);
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
          this.queue.add('archives', { parent_id, ...payload, tokens: 0, status });
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
}
