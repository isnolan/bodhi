import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { SupplierPurchasedService } from './service';
import { ProviderService } from '../provider/service';
import { InstanceType, Provider } from '../provider/entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly provider: ProviderService,
    private readonly purchased: SupplierPurchasedService,
  ) {}

  /**
   * 分配可用节点
   */
  async distribute(provider_ids, conversation): Promise<ProviderWithRelations> {
    const { id, model, provider_id } = conversation;
    console.log(`[supplier]active:`, conversation);

    // 续约
    if (provider_id !== 0) {
      console.log(`[supplier]renewal`, provider_id);
      // Get credential instance
      // 检查前述节点是否可用
      let provider = await this.provider.findActive([provider_id])[0];
      // check in service
      if (provider && provider.instance.type === InstanceType.SESSION) {
        // 检查节点是否占用
        const inServerConversationId = await this.CheckInService(id);
        if (!inServerConversationId || inServerConversationId === id) {
          console.log(`[supplier]renew: renewed`, id);
          // 续期
          await this.Renewal(provider.id, id, 180);
        } else {
          // 降级
          provider = await this.findInactive(provider_ids, conversation, true);
          console.log(`[supplier]renew: downgrade`, provider.id);
        }
      }
      return provider;
    }

    // 新分配
    const credential = await this.findInactive(provider_ids, conversation);
    console.log(`[supplier]distribute`, credential.id);
    return credential;
  }

  private async Renewal(credential_id: number, conversation_id: number, ttl = 180) {
    return this.redis.set(`credential:${credential_id}`, `${conversation_id}`, 'EX', ttl);
  }

  private async CheckInService(credential_id: number): Promise<number> {
    const conversation_id = await this.redis.get(`credential:${credential_id}`);
    return Number(conversation_id);
  }

  /**
   * 选举可用节点
   * @param model
   * @param isDowngrade
   * @returns
   */
  private async findInactive(product_ids, conversation, isDowngrade = false): Promise<ProviderWithRelations> {
    const { model_id } = conversation;
    // 获取可用节点
    // const services = await this.repository.find({
    //   select: ['id', 'name', 'instance_type', 'weight', 'status'],
    //   where: { status: MoreThan(-1) },
    // });
    const services = await this.provider.findActive(product_ids);

    // 筛选可用Puppet(chatgpt、claude)节点
    const chatGptServices = await this.filter(services, async (s: Provider) => {
      const isCache = await this.redis.exists(`credential:${s.id}`);
      return s.model_id === model_id && s.instance.type === InstanceType.SESSION && s.status === 1 && !isCache;
    });

    let currentIndex = -1;
    if (chatGptServices.length > 0 && !isDowngrade) {
      const totalWeight = chatGptServices.reduce((sum: number, service: Provider) => sum + Number(service.weight), 0);
      let randomValue = Math.random() * totalWeight;
      for (let i = 0; i < chatGptServices.length; i++) {
        currentIndex = (currentIndex + 1) % chatGptServices.length;
        randomValue -= Number(chatGptServices[currentIndex].weight);
        if (randomValue <= 0) {
          const supplier = chatGptServices[currentIndex];
          await this.Renewal(supplier.id, conversation.id);
          return supplier;
        }
      }
    }

    // 从API中选举节点
    const apiServices = services.filter((s) => s.model.id === model_id && s.instance.type === InstanceType.API);
    if (apiServices.length > 0) {
      const totalWeight = apiServices.reduce((sum, s) => sum + Number(s.weight), 0);
      let randomValue = Math.random() * totalWeight;
      for (let i = 0; i < apiServices.length; i++) {
        currentIndex = (currentIndex + 1) % apiServices.length;
        randomValue -= Number(apiServices[currentIndex].weight);
        if (randomValue <= 0) {
          return apiServices[currentIndex];
        }
      }
    }

    throw new Error(`No available suppliers yet`);
  }

  private async filter(arr, predicate) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
  }
}
