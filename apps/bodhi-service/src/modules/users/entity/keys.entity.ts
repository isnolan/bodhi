import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Base } from '@/core/common/base.entity';

export enum UsersKeysState {
  VALID = 1,
  INVALID = 0,
  DELETED = -1,
}

@Entity('bodhi_users_keys')
export class UsersKeys extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 48, comment: 'secret key' })
  secret_key: string;

  @Column({ type: 'varchar', length: 40, comment: 'foreign user', default: '' })
  foreign_user_id: string;

  @Column({ type: 'varchar', length: 100, comment: 'Note', default: '' })
  note: string;

  @Column({ type: 'datetime', comment: 'expires', nullable: true })
  expire_at: Date;

  @Column({ type: 'tinyint', comment: 'state', default: UsersKeysState.VALID })
  state: UsersKeysState;

  @OneToMany(() => UsersKeysQuota, 'quota')
  quotas: UsersKeysQuota[];
}

@Entity('bodhi_users_keys_quota')
export class UsersKeysQuota extends Base {
  @Column({ type: 'int', comment: 'key_id' })
  key_id: number;

  @Column({ type: 'int', comment: 'plan' })
  plan_id: number;

  @Column({ type: 'int', comment: 'provider' })
  provider_id: number;

  @Column('int', { comment: 'times limit', default: 0 })
  times_limit: number; // -1: unlimited, 0: disabled, >0: available

  @Column('bigint', { comment: 'tokens limit', default: 0 })
  token_limit: bigint; // -1: unlimited, 0: disabled, >0: available

  @Column({ type: 'int', comment: 'times', default: 0 })
  times_consumed: number;

  @Column({ type: 'bigint', comment: 'tokens', default: 0 })
  tokens_consumed: bigint;

  @Column({ type: 'datetime', comment: 'expires', nullable: true })
  expire_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: UsersKeysState.VALID })
  state: UsersKeysState;

  @ManyToOne(() => UsersKeys)
  @JoinColumn({ name: 'key_id', referencedColumnName: 'id' })
  key: UsersKeys;
}
