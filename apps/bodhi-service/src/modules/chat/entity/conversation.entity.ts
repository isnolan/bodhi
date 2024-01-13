import { Base } from 'src/modules/common/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('bodhi_conversation')
export class ChatConversation extends Base {
  @Column({ type: 'varchar', length: 40, comment: '会话ID', default: '' })
  conversation_id: string;

  @Column({ type: 'int', comment: 'supplier_id', default: 0 })
  supplier_id: number;

  @Column({ type: 'varchar', length: 40, comment: '供应商会话ID', default: '' })
  parent_conversation_id: string;

  @Column({ comment: 'user_id', length: 40, default: '' })
  user_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'Model', default: '' })
  model: string;

  @Column({ type: 'tinyint', comment: 'context', default: 5 })
  context_limit: number;

  @Column({ type: 'tinyint', comment: 'number', default: 1 })
  n: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'temperature', default: 0.8 })
  temperature: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'presence', default: 0 })
  presence_penalty: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'frequency', default: 0 })
  frequency_penalty: number;

  @Column({ type: 'int', comment: 'tokens', default: 0 })
  tokens: number;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  status: number;
}
