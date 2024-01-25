import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum ProductState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_provider_product')
export class ProviderProduct extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  /* model */
  @Column({ type: 'int', comment: 'model', default: 0 })
  model_id: number;

  /* provider */
  @Column({ type: 'int', comment: 'provider', default: 0 })
  provider_id: number;

  @Column({ type: 'int', comment: 'credential', default: 0 })
  credential_id: number;

  /* Cost */
  @Column({ type: 'int', comment: 'cost in', default: 0 })
  cost_in_usd: number;

  @Column({ type: 'int', comment: 'cost out', default: 0 })
  cost_out_usd: number;

  /* Weight */
  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'weight', default: 1 })
  weight: number;

  @Column({ type: 'tinyint', comment: '状态', default: ProductState.ACTIVE })
  status: number;
}
