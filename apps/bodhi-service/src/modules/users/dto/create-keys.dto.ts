import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '' })
  @IsString()
  foreign_id: string;

  @ApiPropertyOptional({ description: 'expire at', example: '' })
  expire_at: Date;

  @ApiPropertyOptional({ description: 'note', example: '' })
  @IsString()
  note: string;
}
