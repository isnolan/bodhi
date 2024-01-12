import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  system_prompt?: string;

  @IsOptional()
  @IsNumber()
  n?: number;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsString()
  message_id?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
