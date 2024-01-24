import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

import { SupplierModelsService } from './service/models.service';
import { SupplierModels } from './entity/models.entity';
import { SupplierCredentialsService, SupplierPurchasedService } from './service';
import { InstanceEnum, SupplierCredentials } from './entity/credentials.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly models: SupplierModelsService,
    private readonly credentials: SupplierCredentialsService,
    private readonly purchased: SupplierPurchasedService,
  ) {}

  async distributeCredential(
    credential_ids: number[],
    conversation_id: number,
    last_credential_id: number,
  ): Promise<SupplierCredentials> {
    console.log(`[supplier]active:`, credential_ids, conversation_id, last_credential_id);

    // Renew
    if (last_credential_id !== 0) {
      console.log(`[supplier]renewal`, last_credential_id);
      // Get credential instance
      let credential = await this.credentials.getInstance(last_credential_id);
      // check in service
      if (credential.ins_type === InstanceEnum.PUPPET) {
        // 检查节点是否占用
        const inServerConversationId = await this.CheckInService(credential.id);
        if (!inServerConversationId || inServerConversationId === conversation_id) {
          console.log(`[supplier]renew: renewed`, credential.id);
          // 续期
          await this.credentials.RenewalProvider(supplier.id, conversation_id, 180);
        } else {
          // 降级
          credential = await this.credentials.getInactive(res.model, conversation_id, true);
          console.log(`[supplier]renew: downgrade`, supplier.id);
        }
      }
      return supplier;
    }

    // Distribute
    const supplier = await this.credentials.getInactive(res.model, conversation_id);
    console.log(`[supplier]distribute`, supplier.id);
    return supplier;
  }

  /**
   * 选举可用节点
   * @param model
   * @param isDowngrade
   * @returns
   */
  public async getInactive(name = 'gemini-pro', conversationId: number, isDowngrade = false): Promise<SupplierModels> {
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
  private async RenewalProvider(supplier_id: number, conversation_id: number, ttl = 180): Promise<void> {
    await this.redis.set(`supplier:${supplier_id}`, `${conversation_id}`, 'EX', ttl);
  }

  private async CheckInService(supplier_id: number): Promise<number> {
    const conversation_id = await this.redis.get(`supplier:${supplier_id}`);
    return Number(conversation_id);
  }
}
