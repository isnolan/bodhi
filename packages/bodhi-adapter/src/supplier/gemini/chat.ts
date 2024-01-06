import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class ChatGeminiAPI extends ChatBaseAPI {
  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://generativelanguage.googleapis.com/v1' }, opts);
    super(options);
  }

  public async sendMessage(opts: types.chat.SendOptions) {
    const response = new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/models/gemini-pro:streamGenerateContent?alt=sse`;
      const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey };
      const body = { contents: opts.history };
      this.fetch({ url, headers, body, onMessage: (data: string) => {} });
    });
  }
}
