import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from '@/core/common/base.entity';
import { UserKeyUsage } from './usage.entity';

export enum UserKeyState {
  VALID = 1,
  INVALID = 0,
  DELETED = -1,
}

@Entity('bodhi_users_keys')
export class UserKey extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 48, comment: 'secret key' })
  secret_key: string;

  @Column({ type: 'varchar', length: 40, comment: 'foreign user', default: '' })
  foreign_user_id: string;

  @Column({ type: 'varchar', length: 100, comment: 'Note', default: '' })
  note: string;

  @Column({ type: 'datetime', comment: 'expires', nullable: true })
  expires_at: Date;

  @Column({ type: 'tinyint', comment: 'state', default: UserKeyState.VALID })
  state: UserKeyState;

  @OneToMany(() => UserKeyUsage, 'quota')
  quotas: UserKeyUsage[];
}
