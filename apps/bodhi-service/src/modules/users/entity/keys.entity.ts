import { Entity, Column } from 'typeorm';
import { Base } from '@/modules/common/base.entity';

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

  @Column({ type: 'varchar', length: 100, comment: 'Note', default: '' })
  note: string;

  @Column({ type: 'datetime', comment: 'ExpireAt', nullable: true })
  expire_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: UsersKeysState.VALID })
  state: UsersKeysState;
}
