import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialsState, Provider, ProviderModels } from '../entity';
import { In, IsNull, MoreThan, Repository, getRepository } from 'typeorm';
import { ProviderWithRelations } from '../dto/find-provider.dto';
import { ProviderModelsService } from './models.service';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
    private readonly models: ProviderModelsService,
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

  public async findModelsByProviders(ids: number[]): Promise<ProviderModels[]> {
    const query = { id: In(ids), status: CredentialsState.ACTIVE };
    const providers = await this.repository.find({
      select: ['model_id'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
    });
    if (providers.length === 0) {
      throw Error(`provider is out of service`);
    }

    const model_ids: number[] = providers.map((provider) => provider.model_id);
    // console.log(`[models]`, ids, providers);
    return await this.models.findByIds(model_ids);
  }

  public async filterProviderByModel(ids: number[], name: string): Promise<number[]> {
    const providers = await this.repository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.model', 'model')
      .where('provider.id IN (:...ids)', { ids })
      .andWhere('model.name = :name', { name })
      .getMany();
    return providers.map((provider) => provider.id);
  }
}
