import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderProduct } from '../entity/product.entity';

@Injectable()
export class ProviderProductService {
  constructor(
    @InjectRepository(ProviderProduct)
    private readonly repository: Repository<ProviderProduct>,
  ) {}

  async find(user_id: number): Promise<ProviderProduct> {
    return await this.repository.findOne({
      // select: ['id', 'user_id', 'mobile', 'email', 'nickname', 'avatar', 'locale', 'status'],
      where: { user_id, status: MoreThan(0) },
    });
  }
}
