import { CleanProcessor } from './clean.processor';
import { DownloadProcessor } from './download.processor';
import { ExtractProcessor } from './extract.processor';

export * from './clean.processor';
export * from './download.processor';
export * from './extract.processor';

export default [DownloadProcessor, ExtractProcessor, CleanProcessor];
