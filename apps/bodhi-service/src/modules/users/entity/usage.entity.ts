import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { UserKey } from './keys.entity';

export enum KeyUsageState {
  VALID = 1,
  INVALID = 0,
  DELETED = -1,
}

@Entity('bodhi_users_keys_usage')
export class UserKeyUsage extends Base {
  @Column({ type: 'int', comment: 'key_id' })
  key_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'model' })
  model: string;

  @Column('int', { comment: 'times limit', default: -1 })
  times_limit: number; // -1: unlimited, 0: disabled, >0: available

  @Column('int', { comment: 'tokens limit', default: -1 })
  tokens_limit: number; // -1: unlimited, 0: disabled, >0: available

  @Column({ type: 'int', comment: 'times', default: 0 })
  times_consumed: number;

  @Column({ type: 'int', comment: 'tokens', default: 0 })
  tokens_consumed: number;

  @Column({ type: 'datetime', comment: 'expires', default: null, nullable: true })
  expires_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: KeyUsageState.VALID })
  state: KeyUsageState;

  @ManyToOne(() => UserKey)
  @JoinColumn({ name: 'key_id', referencedColumnName: 'id' })
  key: UserKey;
}