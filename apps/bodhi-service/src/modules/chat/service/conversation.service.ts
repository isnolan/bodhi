import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ChatConversation } from '../entity/conversation.entity';

@Injectable()
export class ChatConversationService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly repository: Repository<ChatConversation>,
  ) {}

  async findOne(id: number): Promise<ChatConversation> {
    return await this.repository.findOne({ where: { id } });
  }

  async findOneByConversationId(conversation_id: string): Promise<ChatConversation> {
    return await this.repository.findOne({ where: { conversation_id } });
  }

  async findAndCreateOne(conversation_id: string, opts: Partial<ChatConversation>): Promise<ChatConversation> {
    // find
    if (conversation_id) {
      const conversation = await this.findOneByConversationId(conversation_id);
      if (conversation) {
        return conversation;
      }
    }
    // create new one
    Object.assign({ temperature: 0.9, top_p: 1, top_k: 1, n: 1 }, opts);
    return await this.repository.save(this.repository.create({ conversation_id, ...opts }));
  }

  async updateAttribute(id: number, attribute: Partial<ChatConversation>) {
    return this.repository.update(id, attribute);
  }

  // async setTokenInc(id: number, tokens: number) {
  //   const conversation = await this.repository.findOne({ where: { id } });
  //   if (conversation) {
  //     conversation.tokens += tokens;
  //     await this.repository.save(conversation);
  //   }
  // }
}
