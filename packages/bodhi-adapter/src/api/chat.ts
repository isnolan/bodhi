import { ChatGeminiAPI, ChatOpenAIAPI } from '@/supplier';
import { ChatBaseAPI } from '@/supplier/base';

import { SUPPLIER } from './supplier';
import * as types from '@/types';

export class ChatAPI {
  private supplier: ChatBaseAPI | null = null;

  constructor(supplier: string, opts: types.chat.ChatOptions) {
    switch (supplier) {
      case SUPPLIER.GEMINI:
        this.supplier = new ChatGeminiAPI(opts);
        break;
      case SUPPLIER.OPENAI:
        this.supplier = new ChatOpenAIAPI(opts);
        break;
      default:
        throw new Error(`Unsupported supplier type: ${supplier}`);
    }
  }

  public async sendMessage(opts: types.chat.SendOptions) {
    if (!this.supplier) {
      throw new Error('Supplier is not initialized');
    }
    return await this.supplier.sendMessage(opts);
  }
}
