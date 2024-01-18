import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { InstanceEnum, SupplierModels } from '../entity/models.entity';

@Injectable()
export class SupplierModelsService {
  constructor(
    @InjectRepository(SupplierModels)
    private readonly repository: Repository<SupplierModels>,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async get(id: number): Promise<SupplierModels> {
    return await this.repository.findOne({ where: { id }, order: { id: 'ASC' } });
  }

  async updateState(id: number, status: number) {
    await this.repository.update({ id }, { status });
  }

  async findSuppliersByNode(server_id: string): Promise<SupplierModels[]> {
    return await this.repository.find({
      where: { server_id, status: MoreThan(-1), instance_type: In([InstanceEnum.PUPPET]) },
    });
  }

  private async filter(arr: any, predicate: any) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v: any, index: number) => results[index]);
  }

  /**
   * 选举可用节点
   * @param model
   * @param isDowngrade
   * @returns
   */
  async getInactive(name = 'gemini-pro', conversationId: number, isDowngrade = false): Promise<SupplierModels> {
    // 获取可用节点
    const services = await this.repository.find({
      select: ['id', 'name', 'instance_type', 'weight', 'status'],
      where: { status: MoreThan(-1) },
    });

    // 筛选可用Puppet(chatgpt、claude)节点
    const chatGptServices = await this.filter(services, async (service: SupplierModels) => {
      const isCache = await this.redis.exists(`supplier:${service.id}`);
      return service.name === name && service.instance_type === InstanceEnum.PUPPET && service.status === 1 && !isCache;
    });

    let currentIndex = -1;
    if (chatGptServices.length > 0 && !isDowngrade) {
      const totalWeight = chatGptServices.reduce(
        (sum: number, service: SupplierModels) => sum + Number(service.weight),
        0,
      );
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
      (service) => service.name === name && service.instance_type === InstanceEnum.API && service.status === 1,
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
  async getSupplierByModel(name = 'gpt-3.5') {
    // 获取可用节点
    const services = await this.repository.find({
      select: ['id', 'name', 'instance_type', 'weight', 'status'],
      where: { status: MoreThan(0), name },
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

  async getSupplierBySlug(name = 'gpt-3.5'): Promise<SupplierModels> {
    return await this.repository.findOne({ where: { name, instance_type: InstanceEnum.PUPPET } });
  }
}
