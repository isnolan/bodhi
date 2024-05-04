import { Body, Delete, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { createHash } from 'crypto';

import { RequestWithUser } from '@/core/common/request.interface';

import { JwtOrApiKeyGuard } from '../auth/guard/mixed.guard';
import { FileDto, UploadFileReq } from './dto/upload.dto';
import { FilesService } from './files.service';
import { FileService } from './service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@ApiSecurity('api-key', [])
@Controller('files')
export class FilesController {
  constructor(
    private readonly file: FileService,
    private readonly service: FilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Files', description: 'Get Files' })
  @ApiResponse({ status: 200, description: 'success', type: [FileDto] })
  async files(@Req() req: RequestWithUser): Promise<FileDto[]> {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey

    try {
      const rows = await this.service.findActiveFilesByUserId(user_id, client_user_id);
      return rows.map((item) => {
        const url = `https://s.alidraft.com${item.path}`;
        const { name, size, mimetype, hash, expires_at } = item;
        const id = this.file.encodeId(item.id);
        return { id, name, size, mimetype, hash, url, expires_at };
      });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileReq })
  @ApiOperation({ summary: 'Upload File', description: 'Upload File' })
  @ApiResponse({ status: 200, description: 'success', type: [FileDto] })
  @UseInterceptors(FilesInterceptor('files'))
  async upload(@Req() req: RequestWithUser, @UploadedFiles() files, @Body() body: UploadFileReq) {
    const { user_id } = req.user; // from jwt or apikey
    const { purpose } = body;

    try {
      // 计算并检查hash
      return Promise.all(
        files.map(async (upload) => {
          const hashhex = createHash('md5');
          hashhex.update(upload.buffer);
          const mimetype = upload.mimetype;
          const hash = hashhex.digest('hex');
          const size = upload.size;
          const name = Buffer.from(upload.originalname, 'latin1').toString('utf8');

          console.log(`[file]upload`, hash, name, mimetype, size);
          return await this.service.uploadFile(upload, { hash, name, mimetype, size, user_id }, purpose);
        }),
      );
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file detail', description: 'Get file detail' })
  @ApiResponse({ status: 200, description: 'success', type: FileDto })
  async get(@Req() req: RequestWithUser, @Param('id') id: number): Promise<FileDto> {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey

    try {
      const file = await this.service.findActiveFilesById(id, user_id, client_user_id);
      const url = `https://s.alidraft.com${file.path}`;
      delete file.path;

      const file_id = this.file.encodeId(file.id);
      return { ...file, id: file_id, url };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete File', description: 'Delete File' })
  @ApiResponse({ status: 200, description: 'success' })
  async delete(@Req() req: RequestWithUser, @Param('id') id: number) {
    const { user_id } = req.user; // from jwt or apikey

    try {
      // await this.service.deleteFile(id, user_id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
