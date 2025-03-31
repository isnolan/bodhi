import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileReq {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;

  @ApiPropertyOptional()
  purpose: undefined | 'file-extract' | 'fine-tune';
}

export class FileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  expires_at: Date;

  @ApiProperty()
  url: string;

  @ApiProperty()
  state: string;
}

export class FileSimpleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;
}
