import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LimitKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '1' })
  @IsString()
  @IsNotEmpty()
  foreign_user_id: string;

  @ApiPropertyOptional({ description: 'model', example: 'gemini-pro' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiPropertyOptional({ description: 'times limit', example: -1 })
  @IsNumber()
  times_limit: number;

  @ApiPropertyOptional({ description: 'tokens limit', example: -1 })
  @IsNumber()
  tokens_limit: number;

  @ApiPropertyOptional({ description: 'expire at', example: null })
  @IsOptional()
  expire_at: Date;
}
