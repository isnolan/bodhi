import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteKeysDto {
  @ApiProperty({ description: 'foreign user id', example: '1' })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
