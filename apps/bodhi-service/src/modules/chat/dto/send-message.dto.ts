import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { chat } from '@isnolan/bodhi-adapter';

export class SendMessageDto {
  @IsNotEmpty()
  @IsArray()
  product_ids: number[];

  @IsNotEmpty()
  @IsArray()
  messages: chat.Message[];

  @IsOptional()
  @IsString()
  message_id: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
