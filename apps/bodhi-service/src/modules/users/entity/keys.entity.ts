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

  @Column({ type: 'varchar', length: 48, comment: 'SecretKey' })
  secret_key: string;

  @Column({ type: 'varchar', length: 40, comment: 'Note', default: '' })
  foreign_id: string;

  @Column({ type: 'int', comment: 'Quota', default: 0 })
  quota: number;

  @Column({ type: 'int', comment: 'Usage', default: 0 })
  usage: number;

  @Column({ type: 'varchar', length: 100, comment: 'Note', default: '' })
  note: string;

  @Column({ type: 'datetime', comment: 'ExpireAt', nullable: true })
  expire_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: UsersKeysState.VALID })
  state: UsersKeysState;

  @OneToMany(() => UsersKeysQuota, 'plan')
  quotas: UsersKeysQuota[];
}

@Entity('bodhi_users_keys_quota')
export class UsersKeysQuota extends Base {
  @Column({ type: 'int', comment: 'key_id' })
  key_id: number;

  @Column({ type: 'int', comment: 'plan' })
  plan_id: number;

  @Column({ type: 'int', comment: 'model' })
  model_id: number;

  @Column('int', { comment: 'times limit', default: 0 })
  times_limit: number;

  @Column('bigint', { comment: 'tokens limit', default: 0 })
  token_limit: bigint;

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
