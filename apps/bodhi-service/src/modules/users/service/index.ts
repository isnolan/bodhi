export * from './billing.service';
export * from './keys.service';
export * from './project.service';
export * from './user.service';
export * from './wallet.service';

import { UserBillingService } from './billing.service';
import { UserKeyService } from './keys.service';
import { UserProjectService } from './project.service';
import { UsersUserService } from './user.service';
import { UserWalletService } from './wallet.service';

export default [UserKeyService, UsersUserService, UserProjectService, UserWalletService, UserBillingService];
