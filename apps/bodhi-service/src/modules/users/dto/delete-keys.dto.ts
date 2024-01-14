import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteKeysDto {
  @ApiProperty({ description: 'foreign id', example: '' })
  @IsString()
  @IsNotEmpty()
  foreign_id: string;
}
