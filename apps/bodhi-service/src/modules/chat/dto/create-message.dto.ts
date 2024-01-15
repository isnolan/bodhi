import { chat } from '@isnolan/bodhi-adapter';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsNumber()
  conversation_id: number;

  @IsNotEmpty()
  @IsString()
  message_id: string;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsString()
  role: string;

  @IsArray()
  parts: chat.Part[];

  @IsOptional()
  @IsNumber()
  tokens?: number;

  @IsOptional()
  @IsNumber()
  status?: number;

  @IsOptional()
  @IsString()
  parent_id?: string;

  // chatgpt only
  @IsOptional()
  @IsString()
  parent_conversation_id?: string;
}
