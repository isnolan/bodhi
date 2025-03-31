import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum MessageType {
  INPUT = 1,
  OUTPUT = 2,
}

@Entity('bodhi_chat_usage')
export class ChatUsage extends Base {
  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'key_id', default: 0 })
  key_id: number;

  @Column({ type: 'int', comment: 'provider', default: 0 })
  provider_id: number;

  @Column({ type: 'int', comment: 'conversation', default: 0 })
  conversation_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'message id', default: '' })
  message_id: string;

  @Column({ type: 'enum', enum: MessageType, comment: 'type', default: MessageType.INPUT })
  type: MessageType;

  @Column({ type: 'int', comment: 'tokens', default: 0 })
  tokens: number;

  @Column({ type: 'decimal', precision: 12, scale: 10, comment: 'price', default: 0 })
  price: number;
}
