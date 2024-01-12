import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ default: '' })
  @IsNotEmpty()
  @IsString()
  conversation_id: string;

  @ApiProperty({ default: '' })
  @IsOptional()
  @IsString()
  parent_id: string;

  @ApiProperty({ default: '' })
  @IsOptional()
  @IsString()
  prompt: string;
}
