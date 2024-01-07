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
    id: string;
    model: string;
    choices: Choice[];
    useage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  export type Choice = {
    index: number;
    message: { role: string; content: string };
    finish_reason: 'stop' | 'tool_calls' | string | null;
  };
}
