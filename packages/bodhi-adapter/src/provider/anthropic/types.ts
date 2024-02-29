import * as types from '@/types';

export namespace claude {
  /**
   * Request
   */
  export type Request = {
    model: string;
    messages: Content[];
    system: string;
    temperature: number;
    top_k: number;
    top_p: number;
    max_tokens: number;
    metadata?: any;
    stop_sequences: string[];
    stream: boolean;
  };

  export type Content = {
    role: Role;
    content: string;
  };

  export type Role = 'user' | 'assistant';

  /**
   * Response
   */
  export type Response = {
    type:
      | 'message_start'
      | 'content_block_start'
      | 'ping'
      | 'content_block_delta'
      | 'content_block_stop'
      | 'message_delta'
      | 'message_stop';
    message?: Message; // type: content_block_start
    index?: number; // type: content_block_delta
    delta?: Delta; // type: content_block_delta
    content_block?: Delta;
    usage?: Usage;
    // candidates: Candidate[];
    // usageMetadata: usageMetadata;
  };

  export type Message = {
    id: string;
    type: string;
    role: string;
    content: [];
    model: string;
    stop_reason: null;
    stop_sequence: null;
    usage: Usage;
  };

  export type Usage = { input_tokens: number; output_tokens: number };
  export type Delta = {
    type: 'text' | 'text_delta';
    text: string;
    stop_reason?: 'string';
    stop_sequence?: null;
  };

  // export type Candidate = {
  //   content: { parts: Part[]; role: Role };
  //   finishReason: string;
  //   index: number;
  //   safetyRatings: safetyRating[];
  // };
}
