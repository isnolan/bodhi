import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteKeysDto {
  @ApiProperty({ description: 'foreign user id', example: '1' })
  @IsString()
  @IsNotEmpty()
  client_user_id: string;
}
