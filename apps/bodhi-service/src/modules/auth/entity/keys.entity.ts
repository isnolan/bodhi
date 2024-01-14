import { Entity, Column } from 'typeorm';
import { Base } from '@/modules/common/base.entity';

export enum AuthKeysState {
  INVALID = 0,
  VALID = 1,
}

@Entity('bodhi_auth_keys')
export class AuthKeys extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 48, comment: 'SecretKey' })
  secret_key: string;

  @Column({ type: 'varchar', length: 40, comment: 'Note', default: '' })
  foreign_id: string;

  @Column({ type: 'tinyint', comment: '状态', default: AuthKeysState.VALID })
  state: AuthKeysState;
}
