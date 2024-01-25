import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, Raw } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PurchasedState, SupplierPurchased } from '../entity/purchased.entity';

@Injectable()
export class SupplierPurchasedService {
  constructor(
    @InjectRepository(SupplierPurchased)
    private readonly repository: Repository<SupplierPurchased>,
  ) {}

  /**
   * Find active purchased
   * @returns
   */
  async findActiveModels(user_id: number): Promise<SupplierPurchased[]> {
    return this.repository.find({
      select: ['id', 'model_id', 'credential_id', 'slug', 'icon', 'desciption'],
      where: {
        user_id,
        tokens_amount: MoreThan(Raw(`"tokens_used"`)),
        expires_at: MoreThan(new Date()),
        status: PurchasedState.ACTIVE,
      },
    });
  }

  /**
   * Find active purchased
   * @returns
   */
  async hasActiveBySlug(user_id: number, slug: string): Promise<SupplierPurchased[]> {
    return this.repository.find({
      where: {
        user_id,
        slug,
        tokens_amount: MoreThan(Raw(`"tokens_used"`)),
        expires_at: MoreThan(new Date()),
        status: PurchasedState.ACTIVE,
      },
    });
  }
}
