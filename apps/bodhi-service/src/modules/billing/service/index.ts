import { BillingBillService } from './bill.service';
import { BillingTransactionService } from './transaction.service';

export * from './bill.service';
export * from './transaction.service';

export default [BillingBillService, BillingTransactionService];
