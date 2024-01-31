export * from './keys.service';
export * from './user.service';

import { UsersKeysService } from './keys.service';
import { UsersUserService } from './user.service';

export default [UsersKeysService, UsersUserService];
