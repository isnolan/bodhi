import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum InstanceEnum {
  API = 'api',
  PUPPET = 'puppet',
  UNOFFICIAL = 'unofficial',
}

export enum CredentialState {
  ACTIVE = 1,
  INACTIVE = 0,
  FORBIDDEN = -1,
}

export type Authorisation =
  | {
      type: 'apikey';
      api_key: string;
      api_secret: string;
    }
  | {
      type: 'session';
      session_token: string;
      access_token: string;
    };

@Entity('bodhi_supplier_credentials')
export class SupplierCredentials extends Base {
  @Column({ type: 'int', comment: 'model', default: 0 })
  model_id: number;

  /* Instance */
  @Column({ type: 'enum', enum: InstanceEnum, comment: 'instance type', default: InstanceEnum.API })
  ins_type: string;

  @Column({ type: 'varchar', length: 40, comment: 'instance name', default: '' })
  ins_name: string;

  @Column({ type: 'varchar', length: 40, comment: 'instance server', default: '' })
  ins_id: string;

  /* Credentials */
  @Column({ type: 'simple-json', comment: 'Authorisation', default: null })
  authorisation: Authorisation;

  @Column({ precision: 3, comment: '过期时间', default: null })
  expires_at: Date;

  /* Capabilities */
  @Column({ type: 'tinyint', comment: 'vision', default: 0 })
  is_vision: number;

  @Column({ type: 'tinyint', comment: 'knowledge', default: 0 })
  is_knowledge: number;

  /* Cost */
  @Column({ type: 'int', comment: 'cost in', default: 0 })
  cost_in_usd: number;

  @Column({ type: 'int', comment: 'cost out', default: 0 })
  cost_out_usd: number;

  /* Weight */
  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'weight', default: 0 })
  weight: number;

  @Column({ type: 'tinyint', comment: '状态', default: CredentialState.ACTIVE })
  status: number;
}
