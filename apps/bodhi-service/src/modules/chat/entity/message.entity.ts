import { Base } from 'src/modules/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum RoleEnum {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}

@Entity('agent_message')
export class ChatMessage extends Base {
  @Column({ comment: 'Conversation Id', default: 0 })
  conversation_id: number;

  @Column({ comment: 'user_id', length: 40, default: '' })
  user_id: string;

  @Column({ type: 'enum', enum: RoleEnum, comment: 'Role', default: RoleEnum.USER })
  role: string;

  @Column({ type: 'text', comment: 'content', default: null })
  content: string;

  @Column({ type: 'simple-json', comment: 'attachments', default: null })
  attachments: string[];

  @Column({ comment: 'tokens', default: 0 })
  tokens: number;

  @Column({ type: 'varchar', length: 40, comment: 'Message Id', default: '' })
  message_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'Parent Id', default: '' })
  parent_id: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  status: number;
}
