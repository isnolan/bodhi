import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('bodhi_chat_conversation')
export class ChatConversation extends Base {
  @Column({ type: 'int', comment: 'usage', default: 0 })
  usage_id: number;

  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'key usage', default: 0 })
  user_usage_id: number;

  @Column({ type: 'int', comment: 'provider', default: 0 })
  provider_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'slug', default: '' })
  model: string;

  @Column({ type: 'varchar', length: 40, comment: 'conversation id', default: '' })
  conversation_id: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'temperature', default: 0.8 })
  temperature: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'top_p', default: 1 })
  top_p: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'top_k', default: 1 })
  top_k: number;

  @Column({ type: 'tinyint', comment: 'N', default: 1 })
  n: number;

  @Column({ type: 'tinyint', comment: 'context', default: 5 })
  context_limit: number;

  @Column({ type: 'int', comment: 'tokens', default: 0 })
  tokens: number;

  @Column({ type: 'varchar', length: 40, comment: '供应商会话ID', default: '' })
  parent_conversation_id: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  status: number;
}
