import { Entity, Column } from 'typeorm';
import { Base } from '@/modules/common/base.entity';

@Entity('bodhi_auth_keys')
export class AuthKeys extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'SecretKey' })
  secret_key: string;

  @Column({ type: 'varchar', length: 40, comment: 'Note', default: '' })
  note: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1 })
  status: number;
}
