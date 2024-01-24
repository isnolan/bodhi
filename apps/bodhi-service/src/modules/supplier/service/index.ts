export * from './models.service';
export * from './purchased.service';
export * from './credentials.service';
export * from './openapi.processor';
export * from './puppet.processor';

import { SupplierModelsService } from './models.service';
import { SupplierPurchasedService } from './purchased.service';
import { SupplierCredentialsService } from './credentials.service';
import { SupplierOpenAPIProcessor } from './openapi.processor';
import { SupplierPuppetProcessor } from './puppet.processor';

export default [
  SupplierModelsService,
  SupplierPurchasedService,
  SupplierCredentialsService,
  SupplierOpenAPIProcessor,
  SupplierPuppetProcessor,
];
