import { chat } from '@isnolan/bodhi-adapter';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { UsageWithQuota } from '@/modules/subscription/dto/find-useage.dto';

export class SendMessageDto {
  @IsNotEmpty()
  @IsArray()
  usages: UsageWithQuota[];

  @IsNotEmpty()
  @IsArray()
  provider_ids: number[];

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
