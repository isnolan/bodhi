import { chat } from '@isnolan/bodhi-adapter';

export class QueueMessageDto {
  channel: string;

  model_id: number;

  conversation_id: number;

  parent_id: string;

  messages: chat.Message[];
}
