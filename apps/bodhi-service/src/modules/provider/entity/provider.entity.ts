import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Base } from '@/core/common/base.entity';

import { ProviderCredentials } from './credentials.entity';
import { ProviderInstance } from './instance.entity';
import { ProviderModels } from './models.entity';

export enum ProductState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_provider')
export class Provider extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  /* model */
  @Column({ type: 'varchar', length: 40, comment: 'slug', default: '' })
  slug: string;

  @Column({ type: 'int', comment: 'model', default: 0 })
  model_id: number;

  /* provider */
  @Column({ type: 'int', comment: 'provider', default: 0 })
  instance_id: number;

  @Column({ type: 'int', comment: 'credential', default: 0 })
  credential_id: number;

  /* Cost */
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'cost in', default: 0 })
  cost_in_usd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'cost out', default: 0 })
  cost_out_usd: number;

  @Column({ type: 'int', comment: 'sale credits', default: 0 })
  sale_credits: number;

  /* Weight */
  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'weight', default: 1 })
  weight: number;

  @Column({ precision: 3, comment: 'expires', default: null })
  expires_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: ProductState.ACTIVE })
  status: number;

  /* relations */
  @ManyToOne(() => ProviderModels)
  @JoinColumn({ name: 'model_id' })
  model: ProviderModels;

  @ManyToOne(() => ProviderInstance)
  @JoinColumn({ name: 'instance_id' })
  instance: ProviderInstance;

  @ManyToOne(() => ProviderCredentials)
  @JoinColumn({ name: 'credential_id' })
  credential: ProviderCredentials;
}
