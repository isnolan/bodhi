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
  user_id?: string;

  @IsString()
  role: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];

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
