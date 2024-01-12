import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';

import { ChatConversation } from './entity/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ChatConversationService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly repository: Repository<ChatConversation>,
  ) {}

  async createOne(opts: CreateConversationDto): Promise<ChatConversation> {
    const res = this.repository.create(opts);
    return await this.repository.save(res);
  }

  async findOne(id: number): Promise<ChatConversation | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findOneByConversationId(conversation_id: string): Promise<ChatConversation | null> {
    return await this.repository.findOne({ where: { conversation_id } });
  }

  async findAndCreateOne(opts: CreateConversationDto) {
    const { conversation_id, user_id } = opts;
    const { model, context_limit, n, temperature, presence_penalty, frequency_penalty } = opts;
    // get
    if (conversation_id) {
      const res = await this.findOneByConversationId(conversation_id);
      if (res) {
        return res;
      }
    }

    // create
    const d = { user_id, model, context_limit, n, temperature, presence_penalty, frequency_penalty };
    return await this.createOne({ ...d, conversation_id: conversation_id || uuidv4() });
  }

  async updateSupplier(id: number, supplier_id: number) {
    await this.repository.save(plainToClass(ChatConversation, { id, supplier_id }));
  }

  async updateAttribute(id: number, attribute: object) {
    await this.repository.save(plainToClass(ChatConversation, { id, ...attribute }));
  }

  // async setTokenInc(id: number, tokens: number) {
  //   const conversation = await this.repository.findOne({ where: { id } });
  //   if (conversation) {
  //     conversation.tokens += tokens;
  //     await this.repository.save(conversation);
  //   }
  // }
}
