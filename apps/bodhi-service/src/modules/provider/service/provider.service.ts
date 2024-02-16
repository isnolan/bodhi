import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialsState, Provider, ProviderModels } from '../entity';
import { Equal, In, IsNull, MoreThan, Repository, getRepository } from 'typeorm';
import { ProviderWithRelations } from '../dto/find-provider.dto';
import { ProviderModelsService } from './models.service';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
    private readonly models: ProviderModelsService,
  ) {}

  async findByUserId(user_id: number, is_relation?: boolean): Promise<Provider[]> {
    const relations = is_relation ? ['model', 'instance', 'credential'] : [];
    return this.repository.find({
      where: { user_id, status: MoreThan(0) },
      relations,
    });
  }

  /**
   * Find active providers, by purchased
   */
  async findActive(ids: number[]): Promise<ProviderWithRelations[]> {
    const query = {
      id: In(ids),
      status: CredentialsState.ACTIVE,
      model: { status: CredentialsState.ACTIVE },
      credential: { status: CredentialsState.ACTIVE },
      instance: { status: CredentialsState.ACTIVE },
    };
    return this.repository.find({
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
      relations: ['model', 'instance', 'credential'],
    });
  }

  async findModelsByProviders(user_id: number, ids: number[]): Promise<any[]> {
    const query = { id: In(ids), status: CredentialsState.ACTIVE };
    const providers = await this.repository.find({
      select: ['id', 'slug', 'model_id'],
      where: [
        { expires_at: MoreThan(new Date()), ...query },
        { expires_at: IsNull(), ...query },
      ],
      relations: ['model'],
    });
    if (providers.length === 0) {
      throw Error(`provider is out of service`);
    }

    const models = [];
    providers.map((provider) => {
      if (!models.some((m) => m.model === provider.slug)) {
        models.push({ model: provider.slug, icon: provider.model.icon });
      }
    });
    return models;
  }

  async filterProviderByModel(ids: number[], name: string): Promise<number[]> {
    // const providers = await this.repository
    //   .createQueryBuilder('provider')
    //   .leftJoinAndSelect('provider.model', 'model')
    //   .where('provider.id IN (:...ids)', { ids })
    //   .andWhere('model.name = :name', { name })
    //   .getMany();

    const providers = await this.repository.find({
      select: ['id'],
      where: { id: In(ids), slug: Equal(name) },
    });
    return providers.map((provider) => provider.id);
  }
}
