import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum InstanceEnum {
  API = 'api',
  PUPPET = 'puppet',
  UNOFFICIAL = 'unofficial',
}

export enum ModelStateEnum {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

/**
 * Supplier Models
 * slove model and provider
 */
@Entity('bodhi_supplier_models')
export class SupplierModels extends Base {
  @Column({ type: 'int', comment: 'user id', default: 0 })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'name', default: '' })
  name: string;

  /* Cost */
  @Column({ type: 'int', comment: 'cost in', default: 0 })
  cost_in_usd: number;

  @Column({ type: 'int', comment: 'cost out', default: 0 })
  cost_out_usd: number;

  /* Capabilities */
  @Column({ type: 'tinyint', comment: 'vision', default: 0 })
  is_vision: number;

  @Column({ type: 'tinyint', comment: 'knowledge', default: 0 })
  is_knowledge: number;

  @Column({ type: 'tinyint', comment: 'tools', default: 0 })
  is_tools: number;

  /* Provider */
  @Column({ type: 'varchar', length: 60, comment: 'key', default: '' })
  api_key: string;

  @Column({ type: 'text', comment: 'secret', default: null })
  api_secret: string;

  @Column({ type: 'enum', enum: InstanceEnum, comment: 'instance type', default: InstanceEnum.API })
  instance_type: string;

  @Column({ type: 'varchar', length: 40, comment: 'instance name', default: InstanceEnum.API })
  instance_name: string;

  @Column({ type: 'varchar', length: 40, comment: 'server id', default: '' })
  server_id: string;

  /* Weight */
  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'weight', default: 0 })
  weight: number;

  @Column({ type: 'tinyint', comment: '状态', default: ModelStateEnum.ACTIVE })
  status: ModelStateEnum;
}
