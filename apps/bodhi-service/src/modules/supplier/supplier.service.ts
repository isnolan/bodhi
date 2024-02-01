import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { ProviderService } from '@/modules/provider/service';
import { InstanceType } from '@/modules/provider/entity';
import { ProviderWithRelations } from '@/modules/provider/dto/find-provider.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly provider: ProviderService,
  ) {}

  /**
   * 分配可用节点
   */
  async distribute(provider_ids, conversation): Promise<ProviderWithRelations> {
    const { id, provider_id } = conversation;
    // Renewal
    if (provider_id !== 0) {
      // console.log(`[supplier]renewal`, provider_id);
      // Get credential instance
      const providers = await this.provider.findActive([provider_id]);
      // console.log(`[supplier]renew: providers`, provider_id, providers);
      if (providers.length > 0) {
        let provider = providers[0];
        // check in service
        if (provider && provider.instance.type === InstanceType.SESSION) {
          // 检查节点是否占用
          const inServerConversationId = await this.CheckInService(id);
          if (!inServerConversationId || inServerConversationId === id) {
            await this.Renewal(provider.id, id, 180); // renewal
          } else {
            provider = await this.findInactive(provider_ids, conversation, true); // downgrade
          }
        }
        return provider;
      } else {
        throw Error(`supplier is out of service`);
      }
    }

    // distribute new provider
    return await this.findInactive(provider_ids, conversation);
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
  public async findInactive(product_ids, conversation, isDowngrade = false): Promise<ProviderWithRelations> {
    const services = await this.provider.findActive(product_ids);
    // console.log(`[supplier]findInactive`, product_ids, services);

    // from session
    const chatGptServices = await this.filter(services, async (s: ProviderWithRelations) => {
      const isCache = await this.redis.exists(`credential:${s.id}`);
      return s.instance.type === InstanceType.SESSION && !isCache;
    });

    let currentIndex = -1;
    if (chatGptServices.length > 0 && !isDowngrade) {
      const totalWeight = chatGptServices.reduce(
        (sum: number, service: ProviderWithRelations) => sum + Number(service.weight),
        0,
      );
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

    // from api
    const apiServices = services.filter((s) => s.instance.type === InstanceType.API);
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
