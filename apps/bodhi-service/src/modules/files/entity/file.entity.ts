import { Base } from '@/core/common/base.entity';
import { Entity, Column } from 'typeorm';

export enum FileState {
  DELETED = -1,
  CREATED = 0,
  UPLOADED = 1,
  PROCESSED = 2,
}

@Entity('agent_files')
export class File extends Base {
  @Column({ type: 'varchar', length: 32, comment: 'Hash', default: '' })
  hash: string;

  @Column({ type: 'int', comment: 'Size', default: 0 })
  size: number;

  @Column({ type: 'varchar', length: 80, comment: 'Name', default: '' })
  name: string;

  @Column({ type: 'varchar', length: 40, comment: 'Type', default: '' })
  mimetype: string;

  @Column({ type: 'varchar', length: 100, comment: 'Path', default: '' })
  path: string;

  @Column({ type: 'varchar', length: 40, comment: 'FileID', default: '' })
  file_id: string;

  @Column({ type: 'tinyint', comment: '状态', default: 1, nullable: true })
  state: number;
}
