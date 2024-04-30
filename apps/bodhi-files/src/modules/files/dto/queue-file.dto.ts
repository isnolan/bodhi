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
