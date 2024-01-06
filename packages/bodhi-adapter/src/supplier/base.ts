import * as types from '@/types';
import { fetchSSE } from '@/utils/fetch-sse-api';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class ChatBaseAPI {
  agent?: string = '';
  baseURL: string = '';
  apiKey: string = '';
  timeout?: number = 10000;

  constructor(opts: types.chat.ChatOptions) {
    opts.agent && (this.agent = opts.agent);
    opts.baseURL && (this.baseURL = opts.baseURL);
    opts.apiKey && (this.apiKey = opts.apiKey);
    opts.timeout && (this.timeout = opts.timeout);
  }

  public sendMessage(opts: types.chat.SendOptions) {
    throw new Error('Not implemented');
  }

  protected async fetch(opts: types.chat.FetchOptions) {
    return fetchSSE(opts.url, {
      method: opts.method || 'POST',
      headers: opts.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.body),
      agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
      onMessage: opts.onMessage,
    });
  }
}
