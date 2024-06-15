import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';
export enum KeyUsageState {
  VALID = 'valid',
  INVALID = 'invalid',
  DELETED = 'deleted',
}

@Entity('bodhi_users_usage')
export class UserUsage extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'foreign user', default: '' })
  client_user_id: string;

  @Column({ type: 'simple-json', comment: 'models', default: null })
  models: string[];

  @Column({ type: 'int', comment: 'credit blance', default: 0 })
  credit_balance: number;

  @Column({ type: 'int', comment: 'times', default: 0 })
  credit_consumed: number;

  @Column({ type: 'datetime', comment: 'expires', default: null, nullable: true })
  expires_at: Date;

  @Column({ type: 'varchar', length: 40, comment: 'client usage id' })
  client_usage_id: string;

  @Column({ type: 'enum', enum: KeyUsageState, comment: '状态', default: KeyUsageState.VALID })
  state: KeyUsageState;
}
