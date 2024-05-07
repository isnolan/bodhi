declare enum Provider {
  GOOGLE_GEMINI = 'google-gemini',
  GOOGLE_VERTEX = 'google-vertex',
  GOOGLE_CLAUDE = 'google-claude',
  OPENAI_COMPLETIONS = 'openai-completion',
  OPENAI_ASSISTANTS = 'openai-assistant',
  ANTHROPIC_CLAUDE = 'anthropic-claude',
  ANTHROPIC_BEDROCK = 'anthropic-bedrock',
  ALIYUN_QWEN = 'aliyun-qwen',
  ALIYUN_WANX = 'aliyun-wanx',
  QCLOUD_HUNYUAN = 'qcloud-hunyuan',
  MOONSHOT_KIMI = 'moonshot-kimi',
}

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
  type Part = TextPart | FilePart | ToolPart;
  type TextPart = {
    type: 'text';
    text: string;
  };
  type FilePart = {
    type: 'file';
    mimetype: string;
    url: string;
    id: string;
    text?: string;
  };
  type ToolPart = FunctionCallTool | FunctionTool;
  type Tools = FunctionTool;
  type FunctionCallTool = {
    type: 'function_call';
    function_call: {
      name: string;
      args: any;
    };
    id?: string | undefined;
  };
  type FunctionTool = {
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
    usage: Usage;
  };
  type Choice = {
    index: number;
    role: string;
    parts: Part[];
    finish_reason: 'stop' | 'function_call' | string | null;
  };
  type Usage = {
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

declare class ImageAPI {
  private provider;
  constructor(provider: string, opts: chat.ChatOptions);
  sendMessage(opts: image.SendOptions): Promise<any>;
  getTaskResult(task_id: string): Promise<any>;
}

export { ChatAPI, ImageAPI, Provider, chat, image };
