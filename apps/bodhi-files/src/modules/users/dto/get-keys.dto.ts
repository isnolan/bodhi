import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class GetKeysDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty()
  @IsString()
  secret_key: string;

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
