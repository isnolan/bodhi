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
