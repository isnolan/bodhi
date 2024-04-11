import * as types from '@/types';

export namespace kimi {
  /**
   * Request
   */
  export type Request = {
    model: string;
    messages: Message[];
    tools?: Tools[];
    temperature?: number | null;
    top_p?: number | null;
    frequency_penalty?: number | null;
    presence_penalty?: number | null;
    max_tokens?: number | null;
    n?: number | null;
    stop?: string | string[] | null;
    stream: boolean;
  };

  export type Message =
    | { role: 'system'; content: string }
    | { role: 'user'; content: Part[] }
    | { role: 'assistant'; content: TextPart[]; tool_calls: ToolCallPart[] }
    | { role: 'tool'; content: string; tool_call_id: string };

  export type Role = 'system' | 'assistant' | 'user' | 'tool';

  export type Part = TextPart | ImagePart;
  export type TextPart = { type: 'text'; text: string };
  export type ImagePart = { type: 'image_url'; image_url: string };
  export type ToolCallPart = {
    id: string;
    type: 'function';
    function: { name: string; arguments: string; index?: number };
  };

  export type Tools = { type: 'function'; function: types.chat.Function };

  export type Usage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };

  /**
   * Response
   */
  export type Response = {
    id: string;
    object: string;
    created: number;
    model: string;
    system_fingerprint?: string;
    choices: Choice[];
    usage: Usage;
  };

  export type Choice = {
    index: 0;
    message: {
      role: Role;
      content: string | null;
      tool_calls: ToolCallPart[];
    };
    delta: {
      role: Role;
      content: string | null;
      tool_calls: ToolCallPart[];
    };
    logprobs: null;
    finish_reason: string | null; // length, content_filter, tool_calls
  };
}
