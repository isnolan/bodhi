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

  async findModelsByProviders(ids: number[]): Promise<any[]> {
    const query = { id: In(ids), status: CredentialsState.ACTIVE };
    const providers = await this.repository.find({
      select: ['id', 'slug', 'model_id', 'cost_in_usd', 'cost_out_usd', 'expires_at'],
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
      const existing = models.find((m) => m.model === provider.slug);
      const abilities = [];
      provider.model.is_tools == 1 && abilities.push('tools');
      provider.model.is_vision == 1 && abilities.push('vision');
      provider.model.is_docs == 1 && abilities.push('docs');
      if (existing) {
        existing.abilities = [...new Set([...existing.abilities, ...abilities])];
      } else {
        const { icon, context_tokens } = provider.model;
        const { cost_in_usd, cost_out_usd, expires_at } = provider;
        models.push({ model: provider.slug, icon, context_tokens, abilities, cost_in_usd, cost_out_usd, expires_at });
      }
    });
    return models;
  }

  async filterProviderByModel(ids: number[], name: string, abilities: string[]): Promise<number[]> {
    const providers = await this.repository.find({
      select: ['id'],
      where: {
        id: In(ids),
        slug: Equal(name),
        model: {
          is_tools: abilities.includes('tools') ? 1 : 0,
          is_vision: abilities.includes('vision') ? 1 : 0,
          is_docs: abilities.includes('docs') ? 1 : 0,
        },
      },
      relations: ['model'],
    });
    return providers.map((provider) => provider.id);
  }
}
