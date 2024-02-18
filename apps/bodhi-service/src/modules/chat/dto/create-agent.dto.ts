import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export class CreateAgentDto {
  @ApiProperty({ default: uuidv4() })
  @IsOptional()
  @IsString()
  conversation_id: string;

  @ApiProperty({ default: `Generate a less than 50 character short and relevant title for this chat.` })
  @IsNotEmpty()
  @IsString()
  prompt: string;
}
