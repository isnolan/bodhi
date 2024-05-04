import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LimitKeysDto {
  @ApiPropertyOptional({ description: 'client user', example: '1' })
  @IsNotEmpty()
  @IsString()
  client_user_id: string;

  @ApiPropertyOptional({ description: 'client usage', example: '1' })
  @IsNotEmpty()
  @IsString()
  client_usage_id: string;

  @ApiPropertyOptional({ description: 'model', example: ['gemini-pro'] })
  @IsNotEmpty()
  @IsArray()
  models: string[];

  @ApiPropertyOptional({ description: 'times limit', example: -1 })
  @IsOptional()
  @IsNumber()
  times_limit: number;

  @ApiPropertyOptional({ description: 'tokens limit', example: -1 })
  @IsOptional()
  @IsNumber()
  tokens_limit: number;

  @ApiPropertyOptional({ description: 'expires', example: new Date().toISOString() })
  @IsOptional()
  @IsDateString()
  expires_at: Date;
}
