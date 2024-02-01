/**
 * Chat
 */
declare namespace chat {
  class ChatError extends Error {
    name: 'ChatError';
    code: number;
    constructor(message: string, code: number);
  }
  type ChatOptions = {
    agent?: string;
    baseURL?: string;
    apiKey: string;
    apiSecret?: string;
    timeout?: number;
  };
  /**
   * Request
   */
  type SendOptions = {
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
  type Message = {
    role: string;
    parts: Part[];
  };
  type Part = TextPart | FilePart | FunctionPart;
  type TextPart = {
    type: 'text';
    text: string;
  };
  type FilePart = {
    type: 'image' | 'video' | 'file';
    url: string;
  };
  type FunctionPart =
    | {
        type: 'function_call';
        name: string;
        args: any;
      }
    | {
        type: 'function';
        function: Function;
      };
  type Tools = {
    type: 'function';
    function: Function;
  };
  type Function = {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: any;
      required: string[];
    };
  };
  /**
   * Response
   */
  type ChatResponse = {
    id: string;
    model: string;
    choices: Choice[];
    useage: Useage;
  };
  type Choice = {
    index: number;
    role: string;
    parts: Part[];
    finish_reason: 'stop' | 'function_call' | string | null;
  };
  type Useage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

declare namespace image {
  type SendOptions = {
    model: string;
    prompt: string;
  };
}

declare class ChatAPI {
  private provider;
  constructor(provider: string, opts: chat.ChatOptions);
  sendMessage(opts: chat.SendOptions | image.SendOptions): Promise<any>;
}

export { ChatAPI };
