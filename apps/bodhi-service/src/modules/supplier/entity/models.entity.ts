import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum ModelState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_supplier_models')
export class SupplierModels extends Base {
  @Column({ type: 'varchar', length: 40, comment: 'name', default: '' })
  name: string;

  @Column({ type: 'varchar', length: 200, comment: 'icon', default: '' })
  icon: string;

  @Column({ type: 'int', comment: 'cost in', default: 0 })
  cost_in_usd: number;

  @Column({ type: 'int', comment: 'cost out', default: 0 })
  cost_out_usd: number;

  @Column({ type: 'int', comment: 'context', default: 0 })
  context_tokens: number;

  @Column({ type: 'tinyint', comment: 'function', default: 0 })
  is_function: number;

  @Column({ type: 'tinyint', comment: 'vision', default: 0 })
  is_vision: number;

  @Column({ type: 'tinyint', comment: 'status', default: ModelState.ACTIVE })
  status: number;
}
