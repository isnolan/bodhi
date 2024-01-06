import * as types from '@/types';
import { fetchSSE } from '@/utils/fetch-sse-api';
import { HttpsProxyAgent } from 'https-proxy-agent';
export class ChatBaseAPI {
  protected provider: string = '';

  protected agent?: string = '';
  protected baseURL: string = '';
  protected apiKey: string = '';
  protected timeout?: number = 10000;

  constructor(opts: types.chat.ChatOptions) {
    opts.agent && (this.agent = opts.agent);
    opts.baseURL && (this.baseURL = opts.baseURL);
    opts.apiKey && (this.apiKey = opts.apiKey);
    opts.timeout && (this.timeout = opts.timeout);
  }

  public async sendMessage(opts: types.chat.SendOptions): Promise<any> {
    throw new Error('Not implemented');
  }

  protected async fetchSSE(opts: types.chat.FetchOptions) {
    return await fetchSSE(opts.url, {
      method: opts.method || 'POST',
      headers: opts.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.body),
      agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
      onMessage: opts.onMessage,
    });
  }
}
