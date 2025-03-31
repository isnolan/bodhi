import { chat } from '@isnolan/bodhi-adapter';
import { OnGlobalQueueCompleted, Process, Processor } from '@nestjs/bull';
import { forwardRef, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { get_encoding } from 'tiktoken';

import { ChatService } from '@/modules/chat/chat.service';
import { CreateMessageDto } from '@/modules/chat/dto/create-message.dto';
import { ProviderService } from '@/modules/provider/service';
import { UsersService } from '@/modules/users/users.service';

@Processor('bodhi')
export class SupplierArchivesProcessor {
  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
    private readonly users: UsersService,
    private readonly provider: ProviderService,
  ) {}

  /**
   * Archives
   */
  @Process('archives')
  async archives(job: Job<CreateMessageDto>) {
    console.log(`[archives]job:`, job.data);
    const { conversation_id, role, parts, message_id }: CreateMessageDto = job.data; // 必备
    const { parent_conversation_id, parent_id }: any = job.data; // 可选

    /* eslint no-async-promise-executor: */
    return new Promise(async (resolve) => {
      const conversation = await this.chat.findConversation(conversation_id);
      const { user_id, provider_id, key_id } = conversation;

      // user message have been archived in the first time.
      if (role === 'assistant') {
        await this.chat.createMessage({ conversation_id, role, parts, message_id, parent_id });
      }

      // billing
      const { price_in_usd, price_out_usd } = await this.provider.findById(provider_id, false); // provider
      const texts = parts.filter((item) => item.type === 'text').map((item) => (item as chat.TextPart).text);
      const tokens = this.getTokenCount(texts.join(''));
      const price = (tokens / 1000000) * (role === 'user' ? +price_in_usd : +price_out_usd); // price
      const usage = { conversation_id, key_id, provider_id, message_id, tokens, price };
      const amount = await this.chat.insertChatUsage(user_id, usage); // usage
      this.users.updateDraftBill(user_id, amount);

      // todo: 记录到账单
      key_id > 0 && this.users.consumeKeyCredits(user_id, key_id, price);

      // update conversation
      if (parent_conversation_id) {
        this.chat.updateConversationAttr(conversation_id, { parent_conversation_id });
      }

      // sync to webhooks
      try {
        if (key_id > 0) {
          const project = await this.users.findWebhookByKeyId(user_id, key_id);
          // console.log(`->projec`, project);
          if (project) {
            const { sk, webhook, secret } = project;
            const res = await fetch(webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-SECRET-KEY': secret },
              body: JSON.stringify({
                sk,
                model: conversation.model,
                conversation_id: conversation.conversation_id,
                message: { role, parts, message_id, parent_id, tokens },
              }),
            });
            console.log(`[archives]webhook`, res.status, res.statusText);
            // }
          }
        }
      } catch (err) {
        console.log(`[archives]webhook`, err.message);
      }

      resolve({});
    });
  }

  @OnGlobalQueueCompleted()
  async onGlobalCompleted(jobId: number) {
    console.log(`[process]completed`, jobId);
  }

  private getTokenCount(text: string): number {
    const encoding = get_encoding('cl100k_base');
    const tokens = encoding.encode(text).length;
    encoding.free();

    return tokens;
  }
}
