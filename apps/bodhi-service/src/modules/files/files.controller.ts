import { Body, Delete, NotFoundException, Param, Put, Req, UploadedFile } from '@nestjs/common';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { createHash } from 'crypto';

import { RequestWithUser } from '@/core/common/request.interface';

import { JwtOrApiKeyGuard } from '../auth/guard/mixed.guard';
import { FileDto, UploadFileReq } from './dto/upload.dto';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@ApiSecurity('api-key', [])
@Controller('files')
export class FilesController {
  constructor(
    private readonly config: ConfigService,
    private readonly service: FilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Files', description: 'Get Files' })
  @ApiResponse({ status: 200, description: 'success', type: [FileDto] })
  async files(@Req() req: RequestWithUser): Promise<FileDto[]> {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey

    try {
      const rows = await this.service.findActiveByUserId(user_id, client_user_id);
      return rows.map((item) => {
        const url = `${this.config.get('cdn')}/${item.path}`;
        const { name, size, mimetype, expires_at, state } = item;
        const id = this.service.encodeId(item.id);
        return { id, name, size, mimetype, url, expires_at, state };
      });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  @Put('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileReq })
  @ApiOperation({ summary: 'Upload File', description: 'Upload File' })
  @ApiResponse({ status: 200, description: 'success', type: FileDto })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Req() req: RequestWithUser, @UploadedFile() file, @Body() body: UploadFileReq) {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey
    const { purpose } = body;

    try {
      // 计算并检查hash
      const hashhex = createHash('md5');
      hashhex.update(file.buffer);
      const hash = hashhex.digest('hex');
      const mimetype = file.mimetype;
      const size = file.size;
      const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 15 days

      const opts = { hash, name, mimetype, size, expires_at, user_id, client_user_id };

      return this.service.uploadFile(file.buffer, opts, purpose);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find file detail', description: 'Find file detail' })
  @ApiResponse({ status: 200, description: 'success', type: FileDto })
  async find(@Req() req: RequestWithUser, @Param('id') file_id: string): Promise<FileDto> {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey

    try {
      const id = this.service.decodeId(file_id);
      const file = await this.service.findActiveById(id, user_id, client_user_id);
      if (file) {
        const url = `${this.config.get('cdn')}/${file.path}`;
        delete file.path;
        return { ...file, id: file_id, url };
      }
      throw new NotFoundException();
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete File', description: 'Delete File' })
  @ApiResponse({ status: 200, description: 'success' })
  async delete(@Req() req: RequestWithUser, @Param('id') file_id: string) {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey

    try {
      const id = this.service.decodeId(file_id);
      const file = await this.service.findActiveById(id, user_id, client_user_id);
      if (file) {
        this.service.delete(id);
        return;
      }
      throw new NotFoundException();
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
