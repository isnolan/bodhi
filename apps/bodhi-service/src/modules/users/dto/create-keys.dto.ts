import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateKeysDto {
  @ApiProperty({ description: 'balance', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  credits: number;

  @ApiPropertyOptional({ description: 'name', example: '' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'remark', example: '' })
  @IsOptional()
  @IsString()
  remark: string;

  @ApiPropertyOptional({ description: 'expire at', example: new Date() })
  @IsOptional()
  @IsDateString()
  expires_at: Date | null;
}
