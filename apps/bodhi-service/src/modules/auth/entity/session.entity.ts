import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

@Entity('bodhi_auth_session')
export class AuthSession extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 10, comment: 'Region', default: '' })
  region: string;

  @Column({ type: 'varchar', length: 40, comment: 'IP', default: '' })
  user_ip: string;

  @Column({ precision: 3, nullable: true })
  expires_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: 1 })
  status: number;
}
