import { chat } from '@isnolan/bodhi-adapter';

export class QueueMessageDto {
  channel: string;

  provider_id: number;

  conversation_id: number;

  parent_id: string;
}
