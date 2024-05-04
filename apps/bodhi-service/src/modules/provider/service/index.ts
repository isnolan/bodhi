export * from './credentials.service';
export * from './instance.service';
export * from './models.service';
export * from './provider.service';

import { ProviderCredentialsService } from './credentials.service';
import { ProviderInstanceService } from './instance.service';
import { ProviderModelsService } from './models.service';
import { ProviderService } from './provider.service';

export default [ProviderService, ProviderModelsService, ProviderInstanceService, ProviderCredentialsService];
