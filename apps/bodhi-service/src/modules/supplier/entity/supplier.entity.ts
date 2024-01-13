import { Base } from 'src/modules/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum ProviderEnum {
  CHATGPT = 'chatgpt',
  OPENAI = 'openai',
  AZURE = 'azure',
  CLAUDE = 'claude',
  QWEN = 'qwen',
  GOOGLE = 'google',
  ALIYUN = 'aliyun',
  TENCENT = 'tencent',
}

export enum InstanceEnum {
  API = 'api',
  PUPPET = 'puppet',
  ASSISTANT = 'assistant',
}

@Entity('bodhi_supplier')
export class Supplier extends Base {
  @Column({ type: 'mediumint', comment: 'Server ID', default: null, nullable: true })
  server_id: number;

  @Column({ type: 'varchar', length: 32, comment: 'Slug', default: '' })
  slug: string;

  @Column({ type: 'varchar', length: 32, comment: 'Model', default: '' })
  model: string;

  @Column({ type: 'enum', enum: ProviderEnum, comment: 'Provider', default: ProviderEnum.CHATGPT })
  provider: string;

  @Column({ type: 'enum', enum: InstanceEnum, comment: 'Instance', default: InstanceEnum.API })
  instance: string;

  @Column({ type: 'text', comment: 'Authorisation', default: null })
  authorisation: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, comment: 'Weight', default: 0 })
  weight: number;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  status: number;
}
