import { chat } from '@isnolan/bodhi-adapter';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BillingDto {
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @IsNotEmpty()
  @IsNumber()
  key_id: number;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsArray()
  providers: number[];

  @IsNotEmpty()
  @IsArray()
  billing: BillingDto;

  @IsNotEmpty()
  @IsArray()
  messages: chat.Message[];

  @IsOptional()
  @IsString()
  message_id: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  @IsOptional()
  @IsNumber()
  status?: number;
}
