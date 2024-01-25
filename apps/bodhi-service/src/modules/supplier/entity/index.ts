import { SupplierCredentials } from './credentials.entity';
import { SupplierModels } from './models.entity';
import { SupplierProduct } from './product.entity';
import { SupplierPurchased } from './purchased.entity';

export * from './models.entity';
export * from './product.entity';
export * from './credentials.entity';
export * from './purchased.entity';

export default [SupplierModels, SupplierProduct, SupplierCredentials, SupplierPurchased];
