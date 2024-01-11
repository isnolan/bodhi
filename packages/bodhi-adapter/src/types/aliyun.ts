import * as types from '@/types';

export namespace aliyun {
  /**
   * Request
   */
  export type Request = {
    model: string;
    input: { messages: Content[] };
    parameters: {
      temperature?: number;
      top_p: number | undefined;
      top_k: number | undefined;
      max_tokens?: number;
      stop?: string[] | undefined;
      enable_search?: boolean;
      incremental_output: boolean;
      result_format?: 'text' | 'message';
    };
  };

  export type Content = {
    role: Role;
    content: Part[] | string; // fix different model
  };

  export type Role = 'system' | 'user' | 'model' | '';

  export type Part = TextPart | FilePart;
  export type TextPart = { text: string };
  export type FilePart = { image: string };

  export type Usage = { output_tokens: number; input_tokens: number };

  /**
   * Response
   */
  export type Response = {
    output: { choices: Choice[]; finish_reason?: string };
    usage: Usage;
  };

  export type Choice = {
    message: Content;
    finish_reason?: string;
  };
}
