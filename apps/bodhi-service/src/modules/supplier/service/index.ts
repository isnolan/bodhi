export * from './openapi.processor';
export * from './puppet.processor';

import { SupplierOpenAPIProcessor } from './openapi.processor';
import { SupplierPuppetProcessor } from './puppet.processor';

export default [SupplierOpenAPIProcessor, SupplierPuppetProcessor];
