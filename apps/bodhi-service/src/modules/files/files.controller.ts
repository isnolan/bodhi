import Redis from 'ioredis';
import { createHash } from 'crypto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { Controller, Get, Query, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { FilesService } from './files.service';
import { UploadFileReq, FileDto, FileListDto } from './dto/upload.dto';
import { File } from './entity/file.entity';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly service: FilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get File', description: 'Get File' })
  @ApiResponse({ status: 200, description: 'success', type: FileListDto })
  async get(@Query('id') fileId: string): Promise<FileListDto> {
    const id = this.service.decodeId(fileId);
    console.log(`[file]get`, id);
    const { id: file_id, name, path, size, mimetype, hash } = (await this.service.get(id)) as File;
    const url = `https://s.alidraft.com${path}`;
    return { id: this.service.encodeId(file_id), name, url, size, mimetype, hash };
  }

  @Put('upload')
  @ApiOperation({ summary: 'Upload File', description: 'Upload File' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'model', required: false, example: '' })
  @ApiBody({ type: UploadFileReq })
  @ApiResponse({ status: 201, description: 'success', type: FileListDto })
  @UseInterceptors(FileInterceptor('file', {}))
  async upload(@UploadedFile() upload: any, @Query('model') model: string): Promise<FileListDto> {
    console.log(`[file]upload`, upload.originalname, model);
    // 计算并检查hash
    const hashhex = createHash('md5');
    hashhex.update(upload.buffer);
    const mimetype = upload.mimetype;
    const hash = hashhex.digest('hex');
    const size = upload.size;
    const name = Buffer.from(upload.originalname, 'latin1').toString('utf8');

    try {
      console.log(`[file]upload`, hash, name, mimetype, size, model);
      return await this.service.uploadFile(upload, { hash, name, mimetype, size }, model);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('files')
  @ApiOperation({ summary: 'Get Files', description: 'Get Files' })
  @ApiResponse({ status: 200, description: 'success', type: [FileDto] })
  async files(@Query('ids') fileIds: string[]): Promise<FileDto[]> {
    const ids = fileIds.map((id) => this.service.decodeId(id));
    const files = await this.service.findByIds(ids);
    return files.map(({ id, name, path }) => {
      const url = `https://s.alidraft.com${path}`;
      return { id: this.service.encodeId(id), name, url };
    });
  }
}
