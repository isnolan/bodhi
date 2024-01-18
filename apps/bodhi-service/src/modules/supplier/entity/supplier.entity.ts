import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

/**
 * 供应策略
 * 用户已订阅的模型供应商，桥联供应商模型
 */
@Entity('bodhi_supplier')
export class Supplier extends Base {
  @Column({ type: 'int', comment: 'user id', default: 0 })
  user_id: number;

  @Column({ type: 'varchar', length: 32, comment: 'Slug', default: '' })
  slug: string;

  @Column({ type: 'int', comment: 'model', default: 0 })
  model_id: number;

  @Column({ type: 'varchar', length: 60, comment: 'capabilities', default: '' })
  capabilities: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  status: number;
}
