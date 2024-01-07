import { ChatGeminiAPI, ChatOpenAIAPI, ChatVertexAPI } from '@/provider';
import { ChatBaseAPI } from '@/provider/base';

import * as types from '@/types';

export class ChatAPI {
  private provider: ChatBaseAPI | null = null;

  constructor(provider: string, opts: types.chat.ChatOptions) {
    switch (provider) {
      case types.Provider.GEMINI:
        this.provider = new ChatGeminiAPI(opts);
        break;
      case types.Provider.VERTEX:
        this.provider = new ChatVertexAPI(opts);
        break;
      case types.Provider.OPENAI:
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
