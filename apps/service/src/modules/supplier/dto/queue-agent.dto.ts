import { chat } from '@isnolan/bodhi-adapter';

export class QueueAgentDto {
  channel: string;

  provider_id: number;

  parent_id: string;

  message_id: string;

  message: chat.Message;
}
