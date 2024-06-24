import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import { Repository } from 'typeorm';

import { BillingState, UserBilling } from '../entity';

@Injectable()
export class UserBillingService {
  constructor(
    @InjectRepository(UserBilling)
    private readonly repository: Repository<UserBilling>,
  ) {}

  async updateDraftBill(user_id: number, amount: number) {
    const month = moment().utc().format('YYYYMM');
    const opts = { user_id, month, state: BillingState.DRAFT };
    const draft = await this.repository.findOne({ where: opts });

    // update existing one
    if (draft) {
      draft.amount = amount;
      return this.repository.save(draft);
    }

    // insert new one
    return this.repository.save(this.repository.create({ ...opts, amount }));
  }
}
