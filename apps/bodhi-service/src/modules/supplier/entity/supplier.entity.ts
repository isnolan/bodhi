import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum SupplierState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

/**
 * 供应策略
 * 1、用户订阅模型，分配供应商
 * 2、
 */
@Entity('bodhi_supplier')
export class Supplier extends Base {
  @Column({ type: 'varchar', length: 40, comment: 'Slug', default: '' })
  slug: string;

  @Column({ type: 'varchar', length: 100, comment: 'Icon', default: '' })
  icon: string;

  @Column({ type: 'varchar', length: 100, comment: 'Description', default: '' })
  desciption: string;

  @Column({ type: 'varchar', length: 40, comment: 'model', default: '' })
  model: string;

  @Column({ type: 'varchar', length: 60, comment: 'capabilities', default: '' })
  capabilities: string;

  @Column({ type: 'int', comment: '状态', default: SupplierState.ACTIVE })
  status: number;
}
