import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In, Equal } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { InstanceEnum, Supplier } from './entity/supplier.entity';
@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repository: Repository<Supplier>,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async save(model: Supplier): Promise<Supplier> {
    return this.repository.save(model);
  }

  async get(id: number): Promise<Supplier | null> {
    return await this.repository.findOne({
      select: { id: true, server_id: true, model: true, provider: true, instance: true, authorisation: true },
      where: { id },
      order: { id: 'ASC' },
    });
  }

  async updateAuthoriazations(supplier_id: number, authorisation: string) {
    const model = plainToClass(Supplier, { id: supplier_id, authorisation, status: 1 });
    await this.save(model);
  }

  async updateState(supplier_id: number, status: number) {
    const model = plainToClass(Supplier, { id: supplier_id, status });
    await this.save(model);
  }

  /**
   * Get an random supplier
   * @deprecated
   */
  async getRandomOne(types: number[]): Promise<Supplier | null> {
    return await this.repository
      .createQueryBuilder('s')
      .select(['s.id', 's.endpoint', 's.type', 's.api_key'])
      .where(`type in (${types.join(',')}) and status=1`)
      .orderBy('RAND()')
      .getOne();
  }

  private async filter(arr: any, predicate: any) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v: any, index: number) => results[index]);
  }

  async findSuppliersByNode(server_id: number): Promise<Supplier[]> {
    return await this.repository.find({
      select: ['id', 'server_id', 'model', 'provider', 'instance', 'authorisation', 'status'],
      where: { server_id, status: MoreThan(-1), provider: In(['chatgpt', 'claude']) },
    });
  }

  /**
   * 选举可用节点
   * @param model
   * @param isDowngrade
   * @returns
   */
  async getInactive(slug = 'gpt-3.5', conversationId: number, isDowngrade = false): Promise<Supplier> {
    // 获取可用节点
    const services = await this.repository.find({
      select: ['id', 'slug', 'model', 'provider', 'instance', 'weight', 'status'],
      where: { status: MoreThan(-1) },
    });
    // 筛选可用Puppet(chatgpt、claude)节点
    const chatGptServices = await this.filter(services, async (service: Supplier) => {
      const isCache = await this.redis.exists(`supplier:${service.id}`);
      return service.slug === slug && service.instance === InstanceEnum.PUPPET && service.status === 1 && !isCache;
    });

    let currentIndex = -1;
    if (chatGptServices.length > 0 && !isDowngrade) {
      const totalWeight = chatGptServices.reduce((sum: number, service: Supplier) => sum + Number(service.weight), 0);
      let randomValue = Math.random() * totalWeight;
      for (let i = 0; i < chatGptServices.length; i++) {
        currentIndex = (currentIndex + 1) % chatGptServices.length;
        randomValue -= Number(chatGptServices[currentIndex].weight);
        if (randomValue <= 0) {
          const supplier = chatGptServices[currentIndex];
          await this.RenewalProvider(supplier.id, conversationId);
          return supplier;
        }
      }
    }

    // 从API (openai、azure）中选举节点
    const azureAndOpenaiServices = services.filter(
      (service) => service.slug === slug && service.instance === InstanceEnum.API && service.status === 1,
    );

    if (azureAndOpenaiServices.length > 0) {
      const totalWeight = azureAndOpenaiServices.reduce((sum, service) => sum + Number(service.weight), 0);
      let randomValue = Math.random() * totalWeight;
      for (let i = 0; i < azureAndOpenaiServices.length; i++) {
        currentIndex = (currentIndex + 1) % azureAndOpenaiServices.length;
        randomValue -= Number(azureAndOpenaiServices[currentIndex].weight);
        if (randomValue <= 0) {
          return azureAndOpenaiServices[currentIndex];
        }
      }
    }

    throw new Error(`No available suppliers yet`);
  }

  /**
   * 续期 expire the cache key
   */
  async RenewalProvider(supplier_id: number, conversation_id: number, ttl = 180): Promise<void> {
    await this.redis.set(`supplier:${supplier_id}`, `${conversation_id}`, 'EX', ttl);
  }

  async CheckInService(supplier_id: number): Promise<number> {
    const conversation_id = await this.redis.get(`supplier:${supplier_id}`);
    return Number(conversation_id);
  }

  /**
   * 根据权重获取一个指定模型的供应商
   * @param model
   * @returns
   */
  async getSupplierByModel(model = 'gpt-3.5') {
    // 获取可用节点
    const services = await this.repository.find({
      select: { id: true, model: true, provider: true, weight: true, status: true },
      where: { status: MoreThan(0), model: Equal(model) },
    });

    let currentIndex = -1;
    if (services.length > 0) {
      const totalWeight = services.reduce((sum, service) => sum + Number(service.weight), 0);
      let randomValue = Math.random() * totalWeight;
      for (let i = 0; i < services.length; i++) {
        currentIndex = (currentIndex + 1) % services.length;
        randomValue -= Number(services[currentIndex].weight);
        if (randomValue <= 0) {
          const supplier = services[currentIndex];
          return supplier;
        }
      }
    }

    throw Error('无可用Provider');
  }

  async getSupplierBySlug(slug = 'gpt-3.5'): Promise<Supplier | null> {
    return await this.repository.findOne({ where: { slug, instance: InstanceEnum.PUPPET } });
  }
}
