import { ApiProperty } from '@nestjs/swagger';

export class FileQuqueDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url: string;
}

export class FilePuppetDto extends FileQuqueDto {
  @ApiProperty()
  model: string;
}

export class ExtractQueueDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  folderPath: string;

  @ApiProperty()
  filePath: string;
}

export class CleanQueueDto {
  @ApiProperty()
  id: number;
}