import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';

import { ProviderWithRelations } from '../dto/find-provider.dto';
import { CredentialsState, Provider } from '../entity';
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

  async findById(id: number, is_relation?: boolean): Promise<Provider> {
    const relations = is_relation ? ['model', 'instance', 'credential'] : [];
    return this.repository.findOne({ where: { id }, relations });
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
      const abilities = provider.model.abilities; // Use the abilities field directly
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
    // const where = { id: In(ids), slug: Equal(name), model: { status: CredentialsState.ACTIVE } };
    // if (abilities.length > 0) {
    //   abilities.includes('tools') && Object.assign(where.model, { is_tools: 1 });
    //   abilities.includes('vision') && Object.assign(where.model, { is_vision: 1 });
    // }
    // const providers = await this.repository.find({ select: ['id'], where, relations: ['model'] });
    // return providers.map((provider) => provider.id);

    const query = this.repository
      .createQueryBuilder('provider')
      .select('provider.id')
      .innerJoin('provider.model', 'model')
      .where('provider.id IN (:...ids)', { ids })
      .andWhere('provider.slug = :name', { name })
      .andWhere('model.status = :status', { status: CredentialsState.ACTIVE });

    if (abilities.length > 0) {
      abilities.forEach((ability) => {
        query.andWhere(`CONVERT(model.abilities, CHAR) LIKE :ability`, { ability: `%${ability}%` });
      });
    }

    const providers = await query.getMany();
    return providers.map((provider) => provider.id);
  }

  async findProvidersByNode(node: string): Promise<Provider[]> {
    const query = {
      status: CredentialsState.ACTIVE,
      model: { status: CredentialsState.ACTIVE },
      credential: { status: CredentialsState.ACTIVE, node },
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
}
