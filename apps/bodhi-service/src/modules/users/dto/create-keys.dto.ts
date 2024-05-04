import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '' })
  @IsNotEmpty()
  @IsString()
  client_user_id: string;

  @ApiPropertyOptional({ description: 'remark', example: '' })
  @IsOptional()
  @IsString()
  remark: string;

  @ApiPropertyOptional({ description: 'expire at', example: new Date() })
  @IsOptional()
  @IsDateString()
  expires_at: Date | null;
}
