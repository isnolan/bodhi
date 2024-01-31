import { PrimaryColumn, PrimaryGeneratedColumn, Column, VersionColumn } from 'typeorm';

export abstract class Base {
  @PrimaryGeneratedColumn()
  @PrimaryColumn({ comment: 'id' })
  id: number;

  @Column({ type: 'timestamp', precision: 3, comment: 'create', default: () => 'CURRENT_TIMESTAMP(3)' })
  create_at: Date;

  @Column({
    type: 'timestamp',
    precision: 3,
    comment: 'update',
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  update_at: Date;

  @VersionColumn({ type: 'tinyint', comment: 'version', default: 0 })
  version: number;
}
