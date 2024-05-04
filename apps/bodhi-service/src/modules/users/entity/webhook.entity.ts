import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum WebhookState {
  VALID = 'valid',
  INVALID = 'invalid',
  DELETED = 'deleted',
}

@Entity('bodhi_users_webhooks')
export class UserWebhook extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 100, comment: 'url', default: '' })
  url: string;

  @Column({ type: 'varchar', length: 48, comment: 'secret key' })
  secret_key: string;

  @Column({ type: 'datetime', comment: 'expires', default: null, nullable: true })
  expires_at: Date;

  @Column({ type: 'enum', enum: WebhookState, comment: 'state', default: WebhookState.VALID })
  state: WebhookState;
}
