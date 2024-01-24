import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum RoleEnum {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}

@Entity('bodhi_chat_message')
export class ChatMessage extends Base {
  @Column({ comment: 'conversation', default: 0 })
  conversation_id: number;

  @Column({ type: 'int', comment: 'purchase', default: 0 })
  purchase_id: number;

  @Column({ type: 'int', comment: 'credential', default: 0 })
  credential_id: number;

  @Column({ type: 'enum', enum: RoleEnum, comment: 'role', default: RoleEnum.USER })
  role: string;

  @Column({ type: 'simple-json', comment: 'parts', default: null })
  parts: any[];

  @Column({ type: 'simple-json', comment: 'tools', default: null })
  tools: string[];

  @Column({ comment: 'tokens', default: 0 })
  tokens: number;

  @Column({ type: 'varchar', length: 40, comment: 'message id', default: '' })
  message_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'parent id', default: '' })
  parent_id: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1 })
  status: number;
}
