import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  conversation_id?: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  context_limit?: number;

  @IsOptional()
  @IsNumber()
  n?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  presence_penalty?: 0;

  @IsOptional()
  @IsNumber()
  frequency_penalty?: 0;
}
