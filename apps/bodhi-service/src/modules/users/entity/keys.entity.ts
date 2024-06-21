import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum UserKeyState {
  VALID = 'valid',
  INVALID = 'invalid',
  DELETED = 'deleted',
}

@Entity('bodhi_users_keys')
export class UserKey extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'name', default: '' })
  name: string; // 组织名称

  @Column({ type: 'varchar', length: 48, comment: 'secret key' })
  secret_key: string;

  @Column({ type: 'int', comment: 'credits', default: 0 })
  balance: number; // 信用预算

  @Column({ type: 'varchar', length: 100, comment: 'remark', default: '' })
  remark: string;

  @Column({ type: 'datetime', comment: 'expires', default: null, nullable: true })
  expires_at: Date;

  @Column({ type: 'enum', enum: UserKeyState, comment: 'state', default: UserKeyState.VALID })
  state: UserKeyState;
}
