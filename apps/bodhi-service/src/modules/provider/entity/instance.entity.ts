import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum InstanceType {
  API = 'api',
  SESSION = 'session',
}

export enum InstanceState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_provider_instance')
export class ProviderInstance extends Base {
  @Column({ type: 'enum', enum: InstanceType, comment: 'instance type', default: InstanceType.API })
  type: InstanceType;

  @Column({ type: 'varchar', length: 40, comment: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 100, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'tinyint', comment: '状态', default: InstanceState.ACTIVE })
  status: number;
}
