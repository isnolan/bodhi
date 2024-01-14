import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class GetKeysDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  secret_key: string;

  @ApiProperty()
  @IsString()
  foreign_id: string;

  @ApiProperty()
  @IsString()
  note: string;

  @ApiProperty()
  @IsString()
  expire_at: Date;

  @ApiProperty()
  @IsString()
  create_time: Date;
}
