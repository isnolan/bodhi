import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
// import { chat } from '@isnolan/bodhi-adapter';
export class CreateAgentDto {
  @ApiProperty({ default: '' })
  @IsNotEmpty()
  @IsString()
  conversation_id: string;

  @ApiProperty({ default: '' })
  @IsOptional()
  @IsString()
  parent_id: string;

  @ApiProperty({ default: { role: 'user', parts: [{ type: 'text', text: 'Hi' }] } })
  @IsNotEmpty()
  message: any; // chat.Message;
}
