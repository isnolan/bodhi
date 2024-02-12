import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '' })
  @IsNotEmpty()
  @IsString()
  foreign_user_id: string;

  @ApiPropertyOptional({ description: 'expire at', example: new Date() })
  @IsOptional()
  @IsDateString()
  expires_at: Date;

  @ApiPropertyOptional({ description: 'note', example: '' })
  @IsOptional()
  @IsString()
  note: string;
}
