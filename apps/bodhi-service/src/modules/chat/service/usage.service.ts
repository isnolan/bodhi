import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatUsage } from '../entity';

@Injectable()
export class ChatUsageService {
  constructor(
    @InjectRepository(ChatUsage)
    private readonly repository: Repository<ChatUsage>,
  ) {}

  async save(opts: Partial<ChatUsage>): Promise<ChatUsage> {
    return this.repository.save(this.repository.create(opts));
  }

  async getTokensByConversationId(conversation_id: number): Promise<number> {
    const { tokens } = await this.repository
      .createQueryBuilder('usage')
      .select('SUM(usage.tokens)', 'tokens')
      .where('usage.conversation_id = :conversation_id', { conversation_id })
      .getRawOne();
    return tokens;
  }
}
