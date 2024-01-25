import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';
import { ProviderType } from './provider.entity';

export enum ProviderCredentialsState {
  ACTIVE = 1,
  INACTIVE = 0,
  EXPIRED = -1,
  FORBIDDEN = -2,
}

export type Authorisation =
  | {
      type: 'api';
      api_key: string;
      api_secret: string;
    }
  | {
      type: 'session';
      session_token: string;
      access_token: string;
    };

@Entity('bodhi_provider_credentials')
export class ProviderCredentials extends Base {
  @Column({ type: 'int', comment: 'user', default: 0 })
  user_id: number;

  @Column({ type: 'enum', enum: ProviderType, comment: 'type', default: ProviderType.API })
  type: ProviderType;

  @Column({ type: 'varchar', length: 20, comment: 'label', default: '' })
  label: string;

  /* authorisation */
  @Column({ type: 'simple-json', comment: 'authorisation', default: null })
  auth_credentials: Authorisation;

  /* Expires */
  @Column({ precision: 3, comment: 'expires', default: null })
  auth_expires: Date;

  @Column({ type: 'tinyint', comment: '状态', default: ProviderCredentialsState.ACTIVE })
  status: number;
}
