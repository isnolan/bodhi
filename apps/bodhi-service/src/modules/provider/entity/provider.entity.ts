import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum ProviderType {
  API = 'api',
  SESSION = 'session',
}

export enum ProviderState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

@Entity('bodhi_provider')
export class Provider extends Base {
  @Column({ type: 'enum', enum: ProviderType, comment: 'instance type', default: ProviderType.API })
  type: ProviderType;

  @Column({ type: 'varchar', length: 40, comment: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 100, comment: 'description', default: '' })
  description: string;

  @Column({ type: 'tinyint', comment: '状态', default: ProviderState.ACTIVE })
  status: number;
}
