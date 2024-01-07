import { ParseEvent } from 'eventsource-parser';

export namespace chat {
  export type ChatOptions = {
    baseURL?: string;
    agent?: string;
    apiKey: string;
    timeout?: number;
  };

  export type SendOptions = {
    model: string;
    history: any[];
    temperature?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    tools?: any[];
    n?: number;
    max_tokens?: number;
    onProgress?: (event: any) => void;
  };

  export class ChatError extends Error {
    code: number;
    message: string;

    constructor(message: string, code: number) {
      super(message);
      this.name = 'ChatError';
      this.code = code;
      this.message = message;
      // 当使用 TypeScript 的 target 为 ES5 时，需要以下设置，以便能够正确捕获堆栈跟踪
      // Object.setPrototypeOf(this, new.target.prototype);
    }
  }

  export interface FetchOptions {
    url: string;
    method?: string;
    headers?: any;
    body: any;
    onMessage: (event: ParseEvent) => void;
  }

  export type Choice = {
    index: number;
    delta: { content: string };
    finish_reason: 'finished' | 'safety' | 'max_tokens' | string | null;
  };
}
