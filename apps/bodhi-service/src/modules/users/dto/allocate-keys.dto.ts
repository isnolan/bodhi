import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AllocateKeysDto {
  @ApiPropertyOptional({ description: 'plan id', example: 0 })
  @IsNumber()
  @IsNotEmpty()
  plan_id: number;

  @ApiPropertyOptional({ description: 'model slug', example: '' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ description: 'Quota', example: 0 })
  @IsNumber()
  quota: number;

  @ApiPropertyOptional({ description: 'expire at', example: '' })
  expire_at: Date;

  @ApiPropertyOptional({ description: 'note', example: '' })
  @IsString()
  note: string;
}
