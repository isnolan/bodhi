import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum RoleEnum {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}

@Entity('bodhi_tools')
export class Tools extends Base {
  @Column({ comment: 'user_id', length: 40, default: '' })
  user_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'title', default: '' })
  title: string;

  @Column({ type: 'varchar', length: 40, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  status: number;
}
