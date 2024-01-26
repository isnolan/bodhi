import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialsState, Provider } from '../entity';
import { In, IsNull, MoreThan, Repository } from 'typeorm';
import { ProviderWithRelations } from '../dto/find-provider.dto';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
  ) {}

  public async findByUserId(user_id: number, is_relation?: boolean): Promise<Provider[]> {
    const relations = is_relation ? ['model', 'instance', 'credential'] : [];
    return this.repository.find({
      where: { user_id, status: MoreThan(0) },
      relations,
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
      relations: ['model', 'instance', 'credential'],
    });
  }
}
