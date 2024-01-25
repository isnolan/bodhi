export * from './provider.service';
export * from './models.service';
export * from './product.service';
export * from './credentials.service';

import { ProviderModels } from '../entity';
import { ProviderCredentialsService } from './credentials.service';
import { ProviderProductService } from './product.service';
import { ProviderService } from './provider.service';

export default [ProviderService, ProviderModels, ProviderProductService, ProviderCredentialsService];
