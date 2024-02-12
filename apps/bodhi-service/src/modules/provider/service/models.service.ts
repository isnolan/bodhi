import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderModels } from '../entity';

@Injectable()
export class ProviderModelsService {
  constructor(
    @InjectRepository(ProviderModels)
    private readonly repository: Repository<ProviderModels>,
  ) {}

  async get(id: number): Promise<ProviderModels> {
    return await this.repository.findOne({ where: { id }, order: { id: 'ASC' } });
  }

  async updateState(id: number, status: number) {
    await this.repository.update({ id }, { status });
  }

  async findByIds(ids: number[]): Promise<ProviderModels[]> {
    return await this.repository.find({
      select: ['id', 'name', 'icon', 'context_tokens'],
      where: {
        id: In(ids),
        status: MoreThan(-1),
      },
    });
  }
}
