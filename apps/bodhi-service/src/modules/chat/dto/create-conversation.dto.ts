import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  user_id: number;

  @IsOptional()
  @IsString()
  user_key_id: number;

  @IsOptional()
  @IsString()
  conversation_id: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  temperature: number;

  @IsOptional()
  @IsNumber()
  top_p: 0;

  @IsOptional()
  @IsNumber()
  top_k: 0;

  @IsOptional()
  @IsNumber()
  n: number;
}
