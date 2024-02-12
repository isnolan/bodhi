import { Job } from 'bull';
import { Inject, forwardRef } from '@nestjs/common';
import { Process, Processor, OnGlobalQueueCompleted } from '@nestjs/bull';

import { UsersService } from '@/modules/users/users.service';
import { CreateMessageDto } from '@/modules/chat/dto/create-message.dto';
import { SubscriptionService } from '@/modules/subscription/subscription.service';
import { ChatConversationService, ChatMessageService } from '@/modules/chat/service';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

@Processor('bodhi')
export class SupplierArchivesProcessor {
  constructor(
    @Inject(forwardRef(() => ChatMessageService))
    private readonly message: ChatMessageService,
    @Inject(forwardRef(() => ChatConversationService))
    private readonly conversation: ChatConversationService,
    private readonly users: UsersService,
    private readonly subscription: SubscriptionService,
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
    return new Promise(async (resolve) => {
      const conversation = await this.conversation.findOne(conversation_id);
      const { usage_id, provider_id, key_usage_id } = conversation;
      // archive message
      // user message have been archived in the first time.
      if (role === 'assistant') {
        const d3 = { conversation_id, role, parts, message_id, parent_id, status };
        Object.assign(d3, { usage_id, provider_id, tokens });
        const d4 = await this.message.save(d3);
        tokens = d4.tokens;
      }

      // update conversation attribute
      const total_tokens = await this.message.getTokensByConversationId(conversation_id);
      const attr = { tokens: total_tokens };
      parent_conversation_id && Object.assign(attr, { parent_conversation_id });
      await this.conversation.updateAttribute(conversation_id, attr);

      // consume keys quotes, if exists
      if (key_usage_id > 0) {
        console.log(`[archives]key usage`, key_usage_id, tokens);
        await this.users.consumeKeyQuote(key_usage_id, role === 'assistant' ? 1 : 0, tokens);
      }

      if (usage_id > 0) {
        await this.subscription.comsumeUsageQuote(usage_id, role === 'assistant' ? 1 : 0, tokens);
      }

      resolve({});
    });
  }

  @OnGlobalQueueCompleted()
  async onGlobalCompleted(jobId: number) {
    console.log(`[process]completed`, jobId);
  }
}
