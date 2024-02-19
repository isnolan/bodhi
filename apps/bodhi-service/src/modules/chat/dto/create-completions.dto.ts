import { v4 as uuidv4 } from 'uuid';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import type { chat } from '@isnolan/bodhi-adapter';

class CreateChatDto {
  /* 基本内容 */
  @ApiProperty({ default: 'gemini-pro' })
  @IsNotEmpty()
  @IsString()
  model: string;

  // @ApiPropertyOptional({ default: [] })
  // tools: chat.Tools[];

  /* 会话参数 */
  @ApiProperty({ default: 0.8 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  top_p?: 0;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  top_k?: 0;

  // @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  n?: 1;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}

export class CreateCompletionsDto extends CreateChatDto {
  @ApiProperty({ default: [{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }] })
  @IsNotEmpty()
  @IsArray()
  messages: chat.Message[];
}

export class CreateConversationDto extends CreateChatDto {
  @ApiProperty({ default: { role: 'user', parts: [{ type: 'text', text: 'Hi' }] } })
  @IsNotEmpty()
  @IsObject()
  message: chat.Message;

  // @ApiProperty({ default: 5 })
  @IsOptional()
  @IsNumber()
  context_limit?: 5;

  /* 会话保持 */
  @ApiProperty({ default: uuidv4() })
  @IsOptional()
  @IsString()
  conversation_id?: string;

  @ApiPropertyOptional({ default: uuidv4() })
  @IsOptional()
  @IsString()
  message_id?: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  parent_id?: string;
}

export class CreateAgentDto {
  @ApiProperty({ default: '' })
  @IsNotEmpty()
  @IsString()
  conversation_id: string;

  @ApiProperty({ default: 'Generate a less than 50 character short and relevant title for this chat.' })
  @IsNotEmpty()
  @IsString()
  prompt: string;
}

export interface Message {
  role: string;
  content: string;
  name?: string;
  function_call?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface Functions {
  name: string;
  description?: string;
  parameters: any;
}

export class CompletionDto {
  model: string;

  messages: Message;

  functions?: Functions;

  function_call?: string | undefined;

  temperature?: number | null;

  top_p?: number | null;

  n?: number | null;

  stream?: boolean | null;

  stop?: string | any[] | null;

  max_tokens?: number;

  presence_penalty?: number | null;

  frequency_penalty?: number | null;

  user?: string;
}
