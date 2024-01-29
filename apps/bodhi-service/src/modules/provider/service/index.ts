export * from './provider.service';
export * from './models.service';
export * from './credentials.service';
export * from './instance.service';

import { ProviderCredentialsService } from './credentials.service';
import { ProviderInstanceService } from './instance.service';
import { ProviderModelsService } from './models.service';
import { ProviderService } from './provider.service';

export default [ProviderService, ProviderModelsService, ProviderInstanceService, ProviderCredentialsService];
