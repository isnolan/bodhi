import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateKeyDto {
  @ApiProperty({ description: 'project', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  project_id: number;

  @ApiProperty({ description: 'credits', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  credits: number;

  @ApiPropertyOptional({ description: 'name', example: 'ct_1' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'expire at', example: null })
  @IsOptional()
  @IsDateString()
  expires_at: Date | null;
}

export class KeyListDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  sk: string;

  @ApiProperty()
  @IsNumber()
  credits: number;

  @ApiProperty()
  @IsString()
  expires_at: Date;

  @ApiProperty()
  @IsString()
  update_at: Date;
}

export class UpdateKeyCreditsDto {
  @ApiProperty({ description: 'sk', example: '' })
  @IsNotEmpty()
  @IsString()
  sk: string;

  @ApiProperty({ description: 'credits', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  credits: number;
}
