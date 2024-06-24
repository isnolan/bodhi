import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class GetKeysDto {
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
  remark: string;

  @ApiProperty()
  @IsString()
  expires_at: Date;

  @ApiProperty()
  @IsString()
  update_at: Date;
}
