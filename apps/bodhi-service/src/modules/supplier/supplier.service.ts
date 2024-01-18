import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Supplier } from './entity/supplier.entity';
import { SupplierModelsService } from './service/models.service';
import { SupplierModels } from './entity/models.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repository: Repository<Supplier>,
    private readonly models: SupplierModelsService,
  ) {}

  /**
   * 分配供应模型
   * @param model 、
   * @param conversation_id
   * @param last_supplier_id
   * @returns
   */
  async getActiveModel(model: string, conversation_id: number, last_supplier_id: number): Promise<SupplierModels> {
    // Renew
    if (last_supplier_id !== 0) {
      console.log(`[supplier]renewal`, last_supplier_id);
      // 获取节点类型
      let supplier = await this.models.get(last_supplier_id);
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
          supplier = await this.models.getInactive(model, conversation_id, true); // Draft-LM-3L4K
          console.log(`[supplier]renew: downgrade`, supplier.id);
        }
      }
      return supplier;
    }

    // Distribute
    const supplier = await this.models.getInactive(model, conversation_id); // Draft-LM-3L4K
    console.log(`[supplier]distribute`, supplier.id);
    return supplier;
  }
}
