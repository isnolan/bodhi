import { ApiProperty } from '@nestjs/swagger';

export class UploadFileReq {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}

export class FileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;
}

export class FileListDto extends FileDto {
  @ApiProperty()
  size: number;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  hash: string;
}
