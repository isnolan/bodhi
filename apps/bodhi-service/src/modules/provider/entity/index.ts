import { ProviderCredentials } from './credentials.entity';
import { ProviderModels } from './models.entity';
import { ProviderProduct } from './product.entity';
import { Provider } from './provider.entity';

export * from './provider.entity';
export * from './models.entity';
export * from './product.entity';
export * from './credentials.entity';

export default [Provider, ProviderModels, ProviderCredentials, ProviderProduct];
