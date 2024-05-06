import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum FileState {
  CREATED = 'created',
  PROGRESS = 'progress',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

@Entity('bodhi_files')
export class File extends Base {
  @Column({ type: 'int', comment: 'user_id', default: 0 })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'client', default: '' })
  client_user_id: string;

  @Column({ type: 'varchar', length: 32, comment: 'hash', default: '' })
  hash: string;

  @Column({ type: 'int', comment: 'size', default: 0 })
  size: number;

  @Column({ type: 'varchar', length: 80, comment: 'name', default: '' })
  name: string;

  @Column({ type: 'varchar', length: 40, comment: 'type', default: '' })
  mimetype: string;

  @Column({ type: 'varchar', length: 100, comment: 'path', default: '' })
  path: string;

  @Column({ type: 'datetime', comment: 'expires', default: null, nullable: true })
  expires_at: Date;

  @Column({ type: 'varchar', length: 40, comment: 'FileID', default: '' })
  file_id: string;

  @Column({ type: 'varchar', length: 100, comment: 'GURI', default: '' })
  file_uri;

  @Column({ type: 'text', comment: 'extract', default: null })
  extract: string;

  @Column({ type: 'enum', enum: FileState, comment: '状态', default: FileState.CREATED })
  state: FileState;
}
