import { Body, Delete, NotFoundException, Param, Put, Req } from '@nestjs/common';
import { UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  private readonly cdn: string;
  constructor(
    private readonly config: ConfigService,
    private readonly service: FilesService,
  ) {
    this.cdn = this.config.get('cdn');
  }

  @Get()
  @ApiOperation({ summary: 'Get Files', description: 'Get Files' })
  @ApiResponse({ status: 200, description: 'success', type: [FileDto] })
  async files(@Req() req: RequestWithUser): Promise<FileDto[]> {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey

    try {
      const rows = await this.service.findActiveByUserId(user_id, client_user_id);
      return rows.map((item) => {
        const url = `${this.cdn}/${item.path}`;
        const { name, size, mimetype, expires_at } = item;
        const id = this.service.encodeId(item.id);
        return { id, name, size, mimetype, url, expires_at };
      });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  @Put('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileReq })
  @ApiOperation({ summary: 'Upload File', description: 'Upload File' })
  @ApiResponse({ status: 200, description: 'success', type: [FileDto] })
  @UseInterceptors(FilesInterceptor('files'))
  async upload(@Req() req: RequestWithUser, @UploadedFiles() files, @Body() body: UploadFileReq) {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey
    const { purpose } = body;
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 15 days

    try {
      // 计算并检查hash
      return Promise.all(
        files.map((file: Express.Multer.File) => {
          const hashhex = createHash('md5');
          hashhex.update(file.buffer);
          const hash = hashhex.digest('hex');
          const mimetype = file.mimetype;
          const size = file.size;
          const name = Buffer.from(file.originalname, 'latin1').toString('utf8');

          const opts = { hash, name, mimetype, size, expires_at, user_id, client_user_id };
          return this.service.uploadFile(file, opts, purpose);
        }),
      );
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
      const file = await this.service.findById(id, user_id, client_user_id);
      const url = `${this.cdn}/${file.path}`;
      delete file.path;

      return { ...file, id: file_id, url };
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
      const file = await this.service.findById(id, user_id, client_user_id);
      if (file && ['active', 'expired', 'created'].includes(file.state)) {
        this.service.delete(id, user_id);
        return;
      }
      throw new NotFoundException();
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
