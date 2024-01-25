export * from './conversation.service';
export * from './message.service';

import { ChatConversationService } from './conversation.service';
import { ChatMessageService } from './message.service';

export default [ChatConversationService, ChatMessageService];
