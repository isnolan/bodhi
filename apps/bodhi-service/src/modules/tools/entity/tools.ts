import { Base } from 'src/modules/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum RoleEnum {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}

@Entity('bodhi_chat_tools')
export class ChatTools extends Base {
  @Column({ comment: 'user_id', length: 40, default: '' })
  user_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'title', default: '' })
  title: string;

  @Column({ type: 'varchar', length: 40, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 200, comment: 'description', default: '' })
  server: string;

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
