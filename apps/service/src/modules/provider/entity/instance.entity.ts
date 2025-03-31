import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum InstanceType {
  API = 'api',
  SESSION = 'session',
}

export enum InstanceName {
  // API
  GOOGLE_GEMINI = 'google-gemini',
  GOOGLE_VERTEX = 'google-vertex',
  GOOGLE_CLAUDE = 'google-claude',
  OPENAI_COMPLETIONS = 'openai-completion',
  OPENAI_ASSISTANTS = 'openai-assistant',
  ANTHROPIC_CLAUDE = 'anthropic-claude',
  ANTHROPIC_BEDROCK = 'anthropic-bedrock',
  ALIYUN_QWEN = 'aliyun-qwen',
  ALIYUN_WANX = 'aliyun-wanx',
  QCLOUD_HUNYUAN = 'qcloud-hunyuan',
  MOONSHOT_KIMI = 'moonshot-kimi',

  // SESSION
  OPENAI_CHATGPT = 'openai-chatgpt',
  OPENAI_SIGNIN = 'openai-signin',
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

  @Column({ type: 'varchar', length: 40, comment: 'node' })
  node: string;

  @Column({ type: 'tinyint', comment: '状态', default: InstanceState.ACTIVE })
  status: number;
}
