import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ProjectState, UserProject } from '../entity';

@Injectable()
export class UserProjectService {
  constructor(
    @InjectRepository(UserProject)
    private readonly repository: Repository<UserProject>,
  ) {}

  async create(user_id: number, opts: Partial<UserProject>): Promise<UserProject> {
    return this.repository.save(this.repository.create({ user_id, ...opts }));
  }

  async findList(user_id: number): Promise<UserProject[]> {
    return this.repository.find({
      select: ['id', 'name', 'webhook_url', 'remark'],
      where: { user_id, state: In([ProjectState.INVALID, ProjectState.VALID]) },
    });
  }

  async findOne(id: number): Promise<UserProject> {
    return this.repository.findOne({ where: { id } });
  }
}
