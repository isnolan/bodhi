import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ default: 'gpt-3.5-turbo' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({ default: 'hi' })
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @ApiProperty({ default: undefined })
  @IsOptional()
  @IsString()
  conversation_id?: string;

  @ApiPropertyOptional({ default: undefined })
  @IsOptional()
  @IsString()
  message_id?: string;

  @ApiPropertyOptional({ default: undefined })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional({ default: '1' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ default: [] })
  @IsOptional()
  @IsNumber()
  attachments?: string[];

  @ApiProperty({ default: 5 })
  @IsOptional()
  @IsNumber()
  context_limit?: number;

  @ApiProperty({ default: 0.8 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  presence_penalty?: 0;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  frequency_penalty?: 0;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  n?: 1;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  system_prompt?: string;
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
