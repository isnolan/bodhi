import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LimitKeysDto {
  @ApiProperty({ description: 'key id', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'balance', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  balance: number;
}
