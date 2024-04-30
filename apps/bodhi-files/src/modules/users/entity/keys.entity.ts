import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { UserUsage } from './usage.entity';

export enum UserKeyState {
  VALID = 'valid',
  INVALID = 'invalid',
  DELETED = 'deleted',
}

@Entity('bodhi_users_keys')
export class UserKey extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'foreign user', default: '' })
  client_user_id: string;

  @Column({ type: 'varchar', length: 48, comment: 'secret key' })
  secret_key: string;

  @Column({ type: 'varchar', length: 100, comment: 'remark', default: '' })
  remark: string;

  @Column({ type: 'datetime', comment: 'expires', default: null, nullable: true })
  expires_at: Date;

  @Column({ type: 'enum', enum: UserKeyState, comment: 'state', default: UserKeyState.VALID })
  state: UserKeyState;
}
