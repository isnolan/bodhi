import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

@Entity('bodhi_chat_usage')
export class ChatUsage extends Base {
  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'key_id', default: 0 })
  key_id: number;

  @Column({ type: 'int', comment: 'conversation', default: 0 })
  conversation_id: number;

  @Column({ type: 'int', comment: 'message', default: 0 })
  message_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'slug', default: '' })
  model: string;

  @Column({ type: 'int', comment: 'tokens', default: 0 })
  tokens: number;
}
