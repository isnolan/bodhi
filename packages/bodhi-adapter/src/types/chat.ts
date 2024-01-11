import { ParseEvent } from 'eventsource-parser';

/**
 * Chat
 */
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
    apiSecret?: string;
    timeout?: number;
  };

  /**
   * Request
   */
  export type SendOptions = {
    model: string;
    messages: Message[];
    tools?: Tools[];
    temperature?: number;
    top_p?: number;
    top_k?: number;
    n?: number;
    max_tokens?: number;
    stop_sequences?: string[];
    onProgress?: (event: any) => void;
  };

  /* Message */
  export type Message = { role: string; parts: Part[] };

  export type Part = TextPart | FilePart | FunctionPart;
  export type TextPart = { type: 'text'; text: string };
  export type FilePart = { type: 'image' | 'video' | 'file'; url: string };
  export type FunctionPart =
    | { type: 'function_call'; name: string; args: any }
    | { type: 'function'; function: Function };

  /* Function  */
  export type Tools = { type: 'function'; function: Function };

  export type Function = {
    name: string;
    description: string;
    parameters: { type: string; properties: any; required: string[] };
  };

  /**
   * Response
   */
  export type ChatResponse = {
    id: string;
    model: string;
    choices: Choice[];
    useage: Useage;
  };

  export type Choice = {
    index: number;
    role: string;
    parts: Part[];
    finish_reason: 'stop' | 'function_call' | string | null;
  };

  export type Useage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}
