import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';
import { InstanceType } from './instance.entity';

export enum CredentialsState {
  ACTIVE = 1,
  INACTIVE = 0,
  EXPIRED = -1,
  FORBIDDEN = -2,
}

export type KeyAuthorisation = {
  type: 'api';
  api_key: string;
  api_secret: string;
};

export type SessionAuthorisation = {
  type: 'session';
  session_token: string;
  access_token: string;
};

export type Authorisation = KeyAuthorisation | SessionAuthorisation;

@Entity('bodhi_provider_credentials')
export class ProviderCredentials extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'enum', enum: InstanceType, comment: 'type', default: InstanceType.API })
  type: InstanceType;

  @Column({ type: 'varchar', length: 20, comment: 'label', default: '' })
  label: string;

  /* authorisation */
  @Column({ type: 'simple-json', comment: 'authorisation', default: null })
  authorisation: Authorisation;

  @Column({ type: 'varchar', length: 100, comment: 'label', default: '' })
  remark: string;

  /* Expires */
  @Column({ precision: 3, comment: 'expires', default: null })
  expires_at: Date;

  @Column({ type: 'tinyint', comment: '状态', default: CredentialsState.ACTIVE })
  status: number;
}
