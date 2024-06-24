import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateKeysDto {
  @ApiProperty({ description: 'project', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  project_id: number;

  @ApiProperty({ description: 'credits', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  credits: number;

  @ApiPropertyOptional({ description: 'name', example: '' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'expire at', example: new Date() })
  @IsOptional()
  @IsDateString()
  expires_at: Date | null;
}
