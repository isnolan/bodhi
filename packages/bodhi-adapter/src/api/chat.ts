import { OpenAICompletionsAPI, OpenAIAssistantsAPI, GoogleVertexAPI, GoogleGeminiAPI } from '@/provider';
import { AliyunQwenAPI, AliyunWanxAPI } from '@/provider';
import { ChatBaseAPI } from '@/provider/base';

import * as types from '@/types';

export class ChatAPI {
  private provider: ChatBaseAPI | null = null;

  constructor(provider: string, opts: types.chat.ChatOptions) {
    switch (provider) {
      case types.Provider.GOOGLE_VERTEX:
        this.provider = new GoogleVertexAPI(opts);
        break;
      case types.Provider.GOOGLE_GEMINI:
        this.provider = new GoogleGeminiAPI(opts);
        break;
      case types.Provider.OPENAI_COMPLETIONS:
        this.provider = new OpenAICompletionsAPI(opts);
        break;
      case types.Provider.OPENAI_ASSISTANTS:
        this.provider = new OpenAIAssistantsAPI(opts);
        break;
      case types.Provider.ALIYUN_QWEN:
        this.provider = new AliyunQwenAPI(opts);
        break;
      case types.Provider.ALIYUN_WANX:
        this.provider = new AliyunWanxAPI(opts);
        break;
      default:
        throw new Error(`Unsupported supplier: ${provider}`);
    }
  }

  public async sendMessage(opts: types.chat.SendOptions | types.image.SendOptions) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.sendMessage(opts);
  }
}
