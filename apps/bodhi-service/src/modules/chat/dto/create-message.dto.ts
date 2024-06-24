import { chat } from '@isnolan/bodhi-adapter';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsNumber()
  conversation_id: number;

  @IsNotEmpty()
  @IsString()
  message_id: string;

  @IsString()
  role: string;

  @IsArray()
  parts: chat.Part[];

  @IsOptional()
  @IsString()
  parent_id?: string;

  // chatgpt only
  @IsOptional()
  @IsString()
  parent_conversation_id?: string;
}
