import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { chat } from '@isnolan/bodhi-adapter';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  messages: chat.Message[];

  @IsOptional()
  @IsString()
  message_id: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
