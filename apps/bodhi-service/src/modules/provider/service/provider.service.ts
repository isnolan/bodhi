import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';

import { ProviderWithRelations } from '../dto/find-provider.dto';
import { CredentialsState, Provider } from '../entity';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
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

  async findList(): Promise<any[]> {
    const query = { status: CredentialsState.ACTIVE };
    const providers = await this.repository.find({
      select: ['id', 'slug', 'model_id', 'expires_at'],
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
        const { expires_at } = provider;
        models.push({ model: provider.slug, icon, context_tokens, abilities, expires_at });
      }
    });
    return models;
  }

  async filterProviderByModel(name: string, abilities: string[]) {
    const query = this.repository
      .createQueryBuilder('provider')
      .select(['provider.id'])
      .innerJoin('provider.model', 'model')
      .andWhere('provider.slug = :name', { name })
      .andWhere('model.status = :status', { status: CredentialsState.ACTIVE });

    if (abilities.length > 0) {
      abilities.forEach((ability) => {
        query.andWhere(`CONVERT(model.abilities, CHAR) LIKE :ability`, { ability: `%${ability}%` });
      });
    }

    return query.getMany();
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
