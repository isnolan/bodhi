import { OnGlobalQueueCompleted, Process, Processor } from '@nestjs/bull';
import { forwardRef, Inject } from '@nestjs/common';
import { Job } from 'bull';

import { ChatService } from '@/modules/chat/chat.service';
import { CreateMessageDto } from '@/modules/chat/dto/create-message.dto';
import { ProviderService } from '@/modules/provider/service';
import { SubscriptionService } from '@/modules/subscription/subscription.service';
import { UsersService } from '@/modules/users/users.service';

@Processor('bodhi')
export class SupplierArchivesProcessor {
  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
    private readonly users: UsersService,
    private readonly subscription: SubscriptionService,
    private readonly provider: ProviderService,
  ) {}

  /**
   * Archives
   */
  @Process('archives')
  async archives(job: Job<CreateMessageDto>) {
    // console.log(`[archives]job:`, job.data);
    const { conversation_id, role, parts, message_id }: CreateMessageDto = job.data; // 必备
    const { parent_conversation_id, parent_id, status }: any = job.data; // 可选
    let { tokens } = job.data;
    /* eslint no-async-promise-executor: */
    return new Promise(async (resolve) => {
      const conversation = await this.chat.findConversation(conversation_id);
      const { user_id, usage_id, provider_id, key_id } = conversation;

      // user message have been archived in the first time.
      if (role === 'assistant') {
        const d3 = { conversation_id, role, parts, message_id, parent_id, status };
        Object.assign(d3, { usage_id, provider_id, tokens });
        const d4 = await this.chat.createMessage(d3);
        tokens = d4.tokens;
      }

      // update conversation attribute
      const total_tokens = await this.chat.getTokensByConversationId(conversation_id);
      const attr = { tokens: total_tokens };
      parent_conversation_id && Object.assign(attr, { parent_conversation_id });
      this.chat.updateConversationAttr(conversation_id, attr);

      // consume keys quotes, if exists
      const { sale_credit } = await this.provider.findById(provider_id);
      if (key_id > 0) {
        this.users.consumeUsage(user_id, key_id, sale_credit);
      }

      if (usage_id > 0) {
        const consumed = { times: role === 'assistant' ? 1 : 0, tokens };
        this.subscription.comsumeUsageQuote(usage_id, consumed);
      }

      // sync to webhooks
      try {
        const webhook = await this.users.findActiveWebhook(user_id);
        if (webhook && key_id > 0) {
          // TODO:  sync
          // const usage = await this.users.findUsageById(user_usage_id);
          // if (usage) {
          //   const { client_usage_id, client_user_id } = usage;
          //   const res = await fetch(webhook.url, {
          //     method: 'POST',
          //     headers: { 'Content-Type': 'application/json', 'X-SECRET-KEY': webhook.secret_key },
          //     body: JSON.stringify({
          //       client_user_id,
          //       client_usage_id,
          //       conversation: {
          //         id: conversation.conversation_id,
          //         model: conversation.model,
          //         tokens: conversation.tokens,
          //       },
          //       message: { message_id, parent_id, role, parts, tokens, status },
          //     }),
          //   });
          //   console.log(`[archives]webhook`, res.status, res.statusText);
          // }
        } else {
          console.log(`[archives]webhook`, 'skip, no webhook or no usage');
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
}
