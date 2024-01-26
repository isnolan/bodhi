export * from './provider.service';
export * from './models.service';
export * from './credentials.service';
export * from './instance.service';

import { ProviderInstance, ProviderModels } from '../entity';
import { ProviderCredentialsService } from './credentials.service';
import { ProviderService } from './provider.service';

export default [ProviderService, ProviderModels, ProviderInstance, ProviderCredentialsService];
