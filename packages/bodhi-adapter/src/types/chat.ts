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
  };

  export interface FetchOptions {
    url: string;
    method?: string;
    headers?: any;
    body: any;
    onMessage: (data: string) => void;
  }
}
