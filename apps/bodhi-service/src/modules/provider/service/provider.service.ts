import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialsState, Provider } from '../entity';
import { In, IsNull, MoreThan, Repository } from 'typeorm';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
  ) {}

  public async find(user_id: number): Promise<Provider> {
    return await this.repository.findOne({
      where: { user_id, status: MoreThan(0) },
    });
  }

  /**
   * Find active providers, by purchased
   */
  public async findActive(ids: number[]): Promise<ProviderWithRelations[]> {
    const query = { id: In(ids), status: CredentialsState.ACTIVE };
    return this.repository.find({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
      relations: ['model', 'instance'],
    });
  }
}
