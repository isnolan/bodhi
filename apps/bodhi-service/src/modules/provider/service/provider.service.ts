import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialsState, Provider } from '../entity';
import { In, MoreThan, Repository } from 'typeorm';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
  ) {}

  async find(user_id: number): Promise<Provider> {
    return await this.repository.findOne({
      // select: ['id', 'user_id', 'mobile', 'email', 'nickname', 'avatar', 'locale', 'status'],
      where: { user_id, status: MoreThan(0) },
    });
  }

  /**
   * Find active providers
   * @param ids
   * @returns
   */
  async findActive(ids: number[]): Promise<ProviderWithRelations[]> {
    return this.repository.find({
      select: {
        id: true,
        weight: true,
        model: { id: true, name: true, icon: true, is_function: true, is_vision: true },
        instance: { id: true, type: true, name: true },
      },
      where: { id: In(ids), status: CredentialsState.ACTIVE }, // expires_at: MoreThan(new Date()),
      relations: ['model', 'instance'],
    });
  }
}
