import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum PurchasedState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

/**
 * Purchased Models
 */
@Entity('bodhi_supplier_purchased')
export class SupplierPurchased extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'int', comment: 'model', default: 0 })
  product_id: number;

  /* custom */
  @Column({ type: 'varchar', length: 40, comment: 'slug', default: '' })
  slug: string;

  @Column({ type: 'varchar', length: 200, comment: 'icon', default: '' })
  icon: string;

  @Column({ type: 'varchar', length: 100, comment: 'description', default: '' })
  desciption: string;

  /* billing */
  @Column({ type: 'int', comment: 'tokens in', default: 0 })
  tokens_amount_in: number;

  @Column({ type: 'int', comment: 'tokens out', default: 0 })
  tokens_amount_out: number;

  @Column({ precision: 3, comment: 'expires', default: () => 'CURRENT_TIMESTAMP(3)' })
  expires_at: Date;

  @Column({ type: 'int', comment: 'status', default: PurchasedState.ACTIVE })
  status: number;
}
