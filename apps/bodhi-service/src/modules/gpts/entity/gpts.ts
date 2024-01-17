import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('bodhi_gpts')
export class Gpts extends Base {
  @Column({ comment: 'user_id', length: 40, default: '' })
  user_id: string;

  @Column({ type: 'varchar', length: 40, comment: 'name', default: '' })
  name: string;

  @Column({ type: 'varchar', length: 40, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 300, comment: 'icon', default: '' })
  icon_url: string;

  @Column({ type: 'text', comment: 'content', default: null })
  instructions: string;

  @Column({ type: 'simple-json', comment: 'starters', default: null })
  starters: string[];

  @Column({ type: 'simple-json', comment: 'tools', default: null })
  tools: string[];

  // Todo: Knowledge

  @Column({ type: 'tinyint', comment: '状态', default: 0 })
  status: number;
}
