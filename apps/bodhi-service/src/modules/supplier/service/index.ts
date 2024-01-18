export * from './models.service';
export * from './openapi.processor';
export * from './puppet.processor';

import { SupplierModelsService } from './models.service';
import { SupplierOpenAPIProcessor } from './openapi.processor';
import { SupplierPuppetProcessor } from './puppet.processor';

export default [SupplierModelsService, SupplierOpenAPIProcessor, SupplierPuppetProcessor];
