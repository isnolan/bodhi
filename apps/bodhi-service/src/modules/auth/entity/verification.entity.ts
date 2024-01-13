import { Entity, Column } from 'typeorm';
import { Base } from '@/modules/common/base.entity';

/**
 * 验证类型
 */
export enum VerificationType {
  ID = 'id', // 身份证件
  EMAIL = 'email', // 邮箱
  MOBILE = 'mobile', // 手机
}

/**
 * 验证状态
 */
export enum VerificationState {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('bodhi_auth_verification')
export class AuthVerification extends Base {
  @Column({ type: 'int', comment: 'userId', default: 0 })
  user_id: number; // 0: un account, 1: has account

  @Column({ type: 'enum', enum: VerificationType, default: VerificationType.EMAIL })
  type: VerificationType;

  @Column({ type: 'varchar', length: 60, comment: 'Account', default: '' })
  account: string;

  @Column({ type: 'varchar', length: 10, comment: 'code', default: '' })
  code: string;

  @Column({ precision: 3, nullable: true })
  expire_at: Date;

  @Column({ type: 'varchar', length: 48, comment: 'IP', default: '' })
  client_ip: string;

  @Column({ type: 'enum', enum: VerificationState, default: VerificationState.PENDING })
  state: VerificationState;
}
