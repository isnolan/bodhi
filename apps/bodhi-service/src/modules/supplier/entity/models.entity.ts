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

  @Column({ type: 'tinyint', comment: 'status', default: ModelState.ACTIVE })
  status: number;
}
