import { InjectQueue } from '@nestjs/bull';
import { Process, Processor } from '@nestjs/bull';
import { forwardRef, Inject } from '@nestjs/common';
import { Job, Queue } from 'bull';

import { ChatService } from '@/modules/chat/chat.service';
import { KeyAuthorisation } from '@/modules/provider/entity';
import { ProviderService } from '@/modules/provider/service';

import { QueueMessageDto } from '../dto/queue-message.dto';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

@Processor('bodhi')
export class SupplierOpenAPIProcessor {
  private apis: any;

  constructor(
    @InjectQueue('bodhi')
    private readonly queue: Queue,
    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
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

    try {
      const { credential, instance, model } = (await this.provider.findActive([provider_id]))[0];
      const conversation = await this.chat.findConversation(conversation_id);
      const { ChatAPI } = await this.initAPI();
      const { authorisation } = credential;
      const api = new ChatAPI(instance.name, {
        apiKey: (authorisation as KeyAuthorisation).api_key,
        apiSecret: (authorisation as KeyAuthorisation).api_secret,
        agent: process.env.HTTP_PROXY,
      });
      // console.log(`->conversation`, conversation);
      const { context_limit } = conversation;
      const messages = await this.chat.findLastMessagesByConversationId(conversation_id, context_limit, status);

      console.log(`->message`, JSON.stringify(messages));
      const res = await api.sendMessage({
        model: model.name,
        messages: [...messages],
        temperature: Number(conversation.temperature),
        top_p: Number(conversation.top_p),
        n: conversation.n,
        max_tokens: 1000,
        onProgress: (choices) => {
          console.log(`[api]progress`, provider_id, model.name, new Date().toLocaleTimeString('zh-CN'));
          console.log(`->`, JSON.stringify(choices));
          this.chat.reply(channel, choices);
        },
      });
      // console.log(`->res`, JSON.stringify(res));
      // archive
      res.choices.map((row: any) => {
        const payload = { conversation_id, role: row.role, parts: row.parts, message_id: res.id };
        this.queue.add('archives', { parent_id, ...payload, tokens: 0, status });
      });

      // 回复会话
      this.chat.reply(channel, { conversation_id: conversation.conversation_id, ...res });
    } catch (err) {
      console.warn(`[api]`, err.code, err.message);
      this.chat.reply(channel, { error: { message: err.message, code: err.code } });
    }
  }
}
