import { ApiProperty } from '@nestjs/swagger';

export class UploadFileReq {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}

export class FileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  hash: string;

  @ApiProperty()
  expires_at: Date;

  @ApiProperty()
  url: string;
}

export class FileSimpleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;
}
