export * from './keys.service';
export * from './user.service';
export * from './wallet.service';
export * from './webhook.service';

import { UserKeyService } from './keys.service';
import { UsersUserService } from './user.service';
import { UserWalletService } from './wallet.service';
import { UserWebhookService } from './webhook.service';

export default [UserKeyService, UsersUserService, UserWebhookService, UserWalletService];
