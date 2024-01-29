export * from './openapi.processor';
export * from './puppet.processor';
export * from './supplier.service';

import { SupplierOpenAPIProcessor } from './openapi.processor';
import { SupplierPuppetProcessor } from './puppet.processor';
import { SupplierService } from './supplier.service';

export default [SupplierService, SupplierOpenAPIProcessor, SupplierPuppetProcessor];
