export * from './openapi.processor';
export * from './puppet.processor';
export * from './archives.processor';

import { SupplierArchivesProcessor } from './archives.processor';
import { SupplierOpenAPIProcessor } from './openapi.processor';
import { SupplierPuppetProcessor } from './puppet.processor';

export default [SupplierOpenAPIProcessor, SupplierPuppetProcessor, SupplierArchivesProcessor];
