import { Column, Entity } from 'typeorm';

import { Base } from '@/core/common/base.entity';

export enum ProjectState {
  VALID = 'valid',
  INVALID = 'invalid',
  DELETED = 'deleted',
}

@Entity('bodhi_users_project')
export class UserProject extends Base {
  @Column({ comment: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 40, comment: 'name', default: '' })
  name: string; // 项目名称

  @Column({ type: 'varchar', length: 255, comment: 'webhook', default: '' })
  webhook: string;

  @Column({ type: 'varchar', length: 48, comment: 'secret' })
  secret: string;

  @Column({ type: 'enum', enum: ProjectState, comment: 'state', default: ProjectState.VALID })
  state: ProjectState;
}
