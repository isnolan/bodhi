import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateAuthKeysDto {
  @ApiPropertyOptional({ description: 'foreign id', example: '' })
  @IsString()
  foreign_id: string;

  @ApiPropertyOptional({ description: 'expire at', example: '' })
  expire_at: Date;

  @ApiPropertyOptional({ description: 'note', example: '' })
  @IsString()
  note: string;
}

export class AuthDto {
  @IsNumber()
  id: number;

  @IsString()
  secret_key: string;

  @IsString()
  create_time: Date;
}
