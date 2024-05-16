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
  filePath: string;

  @ApiProperty()
  buffer: Buffer;
}

export class CleanQueueDto {
  @ApiProperty()
  id: number;
}

export class StateQueueDto {
  @ApiProperty()
  name: string;
}
