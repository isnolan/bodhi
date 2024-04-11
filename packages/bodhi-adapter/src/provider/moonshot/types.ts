import * as types from '@/types';

export namespace kimi {
  /**
   * Request
   */
  export type Request = {
    model: string;
    messages: Message[];
    temperature?: number | null;
    top_p?: number | null;
    frequency_penalty?: number | null;
    presence_penalty?: number | null;
    max_tokens?: number | null;
    n?: number | null;
    stop?: string | string[] | null;
    stream: boolean;
  };

  export type Message = { role: Role; content: string };

  export type Role = 'system' | 'assistant' | 'user' | 'tool';

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
      content: string;
    };
    delta: {
      role: Role;
      content: string;
    };
    finish_reason: string | null; // length, content_filter, tool_calls
  };
}
