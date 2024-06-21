export * from './keys.service';
export * from './user.service';
export * from './webhook.service';

import { UserKeyService } from './keys.service';
import { UsersUserService } from './user.service';
import { UserWebhookService } from './webhook.service';

export default [UserKeyService, UsersUserService, UserWebhookService];
