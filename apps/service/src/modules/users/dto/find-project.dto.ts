import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ProjectDto {
  @ApiProperty({ description: 'id' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'webhook' })
  @IsString()
  webhook: string;
}
