import { PrimaryColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class Base {
  @PrimaryGeneratedColumn()
  @PrimaryColumn({ comment: 'ID' })
  id: number;

  //自动为实体插入日期
  @CreateDateColumn({ precision: 3, comment: '创建时间', default: () => 'CURRENT_TIMESTAMP(3)' })
  create_time: Date;

  //每次调用实体管理器或存储库的save时，自动更新实体日期
  @UpdateDateColumn({
    precision: 3,
    comment: '更新时间',
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  update_time: Date;

  //每次调用实体管理器或存储库的save时自动增长实体版本
  @VersionColumn({ type: 'tinyint', comment: '数据版本', default: 0 })
  version: number;
}
