import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class ChatOpenAIAPI extends ChatBaseAPI {
  protected provider: string = 'openai';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.openai.com/v1' }, opts);
    super(options);
  }

  async sendMessage(opts: types.chat.SendOptions) {
    const url = `${this.baseURL}/chat/completions`;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` };
    const body = {
      model: opts.model,
      messages: opts.history,
      stream: true,
    };
    return this.fetchSSE({ url, headers, body });
  }
}
