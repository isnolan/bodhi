import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Base } from '@/core/common/base.entity';

import { SubscriptionPlan } from './plan.entity';
export enum QuotaPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum QuotaType {
  CHAT = 'chat',
  FILE = 'file',
  TTS = 'tts',
  IMAGE = 'image',
}

@Entity('bodhi_subscription_quotas')
export class SubscriptionQuota extends Base {
  @Column({ type: 'int', comment: 'plan' })
  plan_id: number;

  @Column({ type: 'enum', enum: QuotaPeriod, comment: 'period', default: QuotaPeriod.DAILY })
  period: QuotaPeriod; // 配额时间周期

  @Column({ type: 'enum', enum: QuotaType, comment: 'type', default: QuotaType.CHAT })
  type: QuotaType;

  @Column('int', { comment: 'quotas', default: 0 })
  quotas: number; // -1: unlimited, 0: disabled, 1: available

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'id' })
  plan: SubscriptionPlan;
}
