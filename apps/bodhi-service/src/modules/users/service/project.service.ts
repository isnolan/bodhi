import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserProject } from '../entity';

@Injectable()
export class UserProjectService {
  constructor(
    @InjectRepository(UserProject)
    private readonly repository: Repository<UserProject>,
  ) {}

  async create(user_id: number, opts: Partial<UserProject>): Promise<UserProject> {
    return this.repository.save(this.repository.create({ user_id, ...opts }));
  }
}
