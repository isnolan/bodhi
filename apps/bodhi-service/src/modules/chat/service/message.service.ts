import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Not, Repository } from 'typeorm';

import { ChatMessage } from '../entity/message.entity';
// import { CreateMessageDto } from '../dto/create-message.dto';

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repository: Repository<ChatMessage>,
  ) {}

  async save(opts: Partial<ChatMessage>): Promise<ChatMessage> {
    return this.repository.save(this.repository.create(opts));
  }

  async findMyMessageId(message_id: string): Promise<ChatMessage> {
    // 获取最近消息
    return this.repository.findOne({ where: [{ message_id }] });
  }

  /**
   * 获取会话最后消息
   * @param conversation_id
   * @returns
   */
  async findLastMessage(conversation_id: number): Promise<ChatMessage> {
    // 获取最近消息
    return this.repository.findOne({
      select: ['id', 'message_id', 'role', 'parts'],
      where: [{ conversation_id, role: 'assistant', status: 1 }],
      order: { id: 'DESC' },
    });
  }

  /**
   * 获取会话最后消息
   * @param conversation_id
   * @param context_limit 上下文条数
   * @returns
   */
  async findLastMessages(conversation_id: number, context_limit = 5, status = 1): Promise<ChatMessage[]> {
    const select = { role: true, parts: true };
    // 获取前两条消息，仅留下 system、user 的消息
    const user: ChatMessage[] = (
      await this.repository.find({
        select,
        where: [{ conversation_id }],
        order: { id: 'ASC' },
        take: 2,
      })
    ).filter((row) => ['system', 'user'].includes(row.role));

    // 获取最近消息
    const latest = await this.repository.find({
      select,
      where: [{ conversation_id, role: Not('system'), status: MoreThanOrEqual(status) }],
      order: { id: 'DESC' },
      take: context_limit - 2,
    });

    // 合并数组并按照user和assistant成对出现
    const messages: ChatMessage[] = [...user, ...latest.reverse()];
    for (let i = messages.length - 1; i > 0; i--) {
      if (messages[i].role === messages[i - 1].role) {
        messages[i - 1] = messages[i];
      }
    }

    // 当消息条数较少时，可能出现重复，排重
    return [...new Set(messages.map((item) => JSON.stringify(item)))].map((item) => JSON.parse(item));
  }

  async checkExistByMessageId(message_id: string): Promise<ChatMessage> {
    return await this.repository.findOne({
      select: { id: true },
      where: { message_id },
      order: { id: 'ASC' },
    });
  }
}
