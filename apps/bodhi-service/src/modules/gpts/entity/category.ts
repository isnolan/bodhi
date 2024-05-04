import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

@Entity('bodhi_gpts_category')
export class GptsCategory extends Base {
  @Column({ type: 'varchar', length: 40, comment: 'title', default: '' })
  title: string;

  @Column({ type: 'int', comment: 'parent', default: 0 })
  parent_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1 })
  status: number;
}
