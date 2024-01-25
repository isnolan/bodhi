import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum AuthType {
  API = 'api',
  SESSION = 'session',
}

export enum ProductState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_supplier_product')
export class SupplierProduct extends Base {
  /* model */
  @Column({ type: 'int', comment: 'model', default: 0 })
  model_id: number;

  /* provider */
  @Column({ type: 'enum', enum: AuthType, comment: 'instance type', default: AuthType.API })
  auth_type: AuthType;

  @Column({ type: 'int', comment: 'model', default: 0 })
  credential_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'instance name', default: '' })
  ins_name: string;

  /* Cost */
  @Column({ type: 'int', comment: 'cost in', default: 0 })
  cost_in_usd: number;

  @Column({ type: 'int', comment: 'cost out', default: 0 })
  cost_out_usd: number;

  /* Expires */
  @Column({ precision: 3, comment: '过期时间', default: null })
  expires_at: Date;

  /* Weight */
  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'weight', default: 0 })
  weight: number;

  @Column({ type: 'tinyint', comment: '状态', default: ProductState.ACTIVE })
  status: number;
}
