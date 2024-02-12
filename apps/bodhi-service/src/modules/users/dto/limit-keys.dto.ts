import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LimitKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '1' })
  @IsString()
  @IsNotEmpty()
  client_user_id: string;

  @ApiPropertyOptional({ description: 'model', example: 'gemini-pro' })
  @IsNotEmpty()
  @IsString()
  models: string;

  @ApiPropertyOptional({ description: 'times limit', example: -1 })
  @IsNumber()
  times_limit: number;

  @ApiPropertyOptional({ description: 'tokens limit', example: -1 })
  @IsNumber()
  tokens_limit: number;

  // @ApiPropertyOptional({ description: 'expire at', example: null })
  // @IsOptional()
  // expires_at: Date;
}
