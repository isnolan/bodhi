import { Provider, ChatGeminiAPI, ChatOpenAIAPI } from '@/provider';
import { ChatBaseAPI } from '@/provider/base';

import * as types from '@/types';

export class ChatAPI {
  private provider: ChatBaseAPI | null = null;

  constructor(provider: string, opts: types.chat.ChatOptions) {
    switch (provider) {
      case Provider.GEMINI:
        this.provider = new ChatGeminiAPI(opts);
        break;
      case Provider.OPENAI:
        this.provider = new ChatOpenAIAPI(opts);
        break;
      default:
        throw new Error(`Unsupported supplier type: ${provider}`);
    }
  }

  public async sendMessage(opts: types.chat.SendOptions) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.sendMessage(opts);
  }
}
