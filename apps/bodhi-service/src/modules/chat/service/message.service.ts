import { Repository, Not, MoreThanOrEqual } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { get_encoding } from 'tiktoken';
import { ChatMessage } from '../entity/message.entity';
// import { CreateMessageDto } from '../dto/create-message.dto';

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repository: Repository<ChatMessage>,
  ) {}

  async save(opts: Partial<ChatMessage>): Promise<ChatMessage> {
    const { parent_id, parts } = opts; // 可选参数
    let { tokens } = opts;
    if (!opts.tokens) {
      const content = parts
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('');
      tokens = this.getTokenCount(content);
    }
    return await this.repository.save(this.repository.create({ ...opts, parent_id, tokens }));
  }

  async findMyMessageId(message_id: string): Promise<ChatMessage> {
    // 获取最近消息
    return await this.repository.findOne({ where: [{ message_id }] });
  }

  /**
   * 获取会话最后消息
   * @param conversation_id
   * @returns
   */
  async getLastMessage(conversation_id: number): Promise<ChatMessage> {
    // 获取最近消息
    return await this.repository.findOne({
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
  async getLastMessages(conversation_id: number, context_limit = 5, status = 1): Promise<ChatMessage[]> {
    const select = { role: true, parts: true, tokens: true };
    // 获取前两条消息
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

    // 合并数组
    const messages: ChatMessage[] = [...user, ...latest.reverse()];

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

  getTokenCount(text: string): number {
    const encoding = get_encoding('cl100k_base');
    const tokens = encoding.encode(text).length;
    encoding.free();

    return tokens;
  }

  async getTokensByConversationId(conversation_id: number): Promise<number> {
    const { tokens } = await this.repository
      .createQueryBuilder('message')
      .select('SUM(message.tokens)', 'tokens')
      .where('message.conversation_id = :conversation_id', { conversation_id })
      .getRawOne();
    return tokens;
  }
}
