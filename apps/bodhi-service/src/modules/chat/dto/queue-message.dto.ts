export class QueueMessageDto {
  channel: string;

  supplier_id: number;

  conversation_id: number;

  parent_id: string;

  content: string;

  attachments?: string[];
}
