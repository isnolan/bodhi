import { ParseEvent } from 'eventsource-parser';

export namespace chat {
  export class ChatError extends Error {
    name: 'ChatError';
    code: number;
    constructor(message: string, code: number) {
      super(message);
      this.code = code;
    }
  }

  export type ChatOptions = {
    agent?: string;
    baseURL?: string;
    apiKey: string;
    timeout?: number;
  };

  export type SendOptions = {
    model: string;
    messages: any[];
    tools?: any[];
    temperature?: number;
    top_p?: number;
    top_k?: number;
    n?: number;
    max_tokens?: number;
    stop_sequences?: string[];
    onProgress?: (event: any) => void;
  };

  export type ChatResponse = {
    candidates: any[];
    model: string;
    time: number;
  };

  export type Choice = {
    index: number;
    delta: { content: string };
    finish_reason: 'finished' | 'safety' | 'max_tokens' | string | null;
  };
}
