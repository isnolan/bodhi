import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

@Entity('bodhi_users')
export class Users extends Base {
  @ApiProperty()
  @Column({ type: 'varchar', length: 10, comment: 'user_id', nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 16, comment: 'mobile', default: '' })
  mobile: string;

  @Column({ type: 'varchar', length: 48, comment: 'email', default: '' })
  email: string;

  @Column({ type: 'varchar', length: 32, comment: 'password', default: '' })
  password: string;

  @Column({ type: 'varchar', length: 32, comment: 'nickname', default: '' })
  nickname: string;

  @Column({ type: 'varchar', length: 255, comment: 'avatar', default: '' })
  avatar: string;

  @Column({ type: 'varchar', length: 10, comment: 'locale', default: 'en-US' })
  locale: string;

  @Column({ type: 'varchar', length: 50, comment: 'timezone', default: 'Asia/Shanghai' })
  timezone: string;

  @Column({ type: 'tinyint', comment: '状态', default: 0 })
  status: number;
}
