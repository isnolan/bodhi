import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '' })
  @IsString()
  @IsNotEmpty()
  foreign_id: string;

  @ApiPropertyOptional({ description: 'Quota', example: 0 })
  @IsNumber()
  quota: number;

  @ApiPropertyOptional({ description: 'expire at', example: '' })
  expire_at: Date;

  @ApiPropertyOptional({ description: 'note', example: '' })
  @IsString()
  note: string;
}
