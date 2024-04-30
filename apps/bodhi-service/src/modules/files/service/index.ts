import { FileService } from './file.service';
import { ExtractProcessor } from './extract.processor';
import { DownloadProcessor } from './download.processor';

export * from './file.service';
export * from './extract.processor';
export * from './download.processor';

export default [FileService, DownloadProcessor, ExtractProcessor];
