import { Injectable } from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Supplier, SupplierState } from './entity/supplier.entity';
import { SupplierModelsService } from './service/models.service';
import { SupplierModels } from './entity/models.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repository: Repository<Supplier>,
    private readonly models: SupplierModelsService,
  ) {}

  async getModels(): Promise<Supplier[]> {
    return await this.repository.find({
      select: ['id', 'slug', 'icon', 'desciption', 'capabilities'],
      where: { status: SupplierState.ACTIVE },
    });
  }

  async get(id: number): Promise<Supplier> {
    return await this.repository.findOne({ where: { id } });
  }

  /**
   * Distribute supplier model
   * @param model 、
   * @param conversation_id
   * @param last_model_id
   * @returns
   */
  async getActiveModel(conversation_id: number, slug: string, last_model_id: number): Promise<SupplierModels> {
    const { model } = await this.repository.findOne({ where: { slug } });
    console.log(`[supplier]getActiveModel`, model, conversation_id, last_model_id);
    // Renew
    if (last_model_id !== 0) {
      console.log(`[supplier]renewal`, last_model_id);
      // 获取节点类型
      let supplier = await this.models.get(last_model_id);
      // 若Puppet节点，则续期占用
      if (supplier.instance_type === 'puppet') {
        // 检查节点是否占用
        const inServerConversationId = await this.models.CheckInService(supplier.id);
        if (!inServerConversationId || inServerConversationId === conversation_id) {
          console.log(`[supplier]renew: renewed`, supplier.id);
          // 续期
          await this.models.RenewalProvider(supplier.id, conversation_id, 180);
        } else {
          // 降级
          supplier = await this.models.getInactive(model, conversation_id, true);
          console.log(`[supplier]renew: downgrade`, supplier.id);
        }
      }
      return supplier;
    }

    // Distribute
    const supplier = await this.models.getInactive(model, conversation_id);
    console.log(`[supplier]distribute`, supplier.id);
    return supplier;
  }
}
