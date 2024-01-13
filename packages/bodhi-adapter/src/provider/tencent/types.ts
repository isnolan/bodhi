export namespace hunyuan {
  /**
   * Request
   */
  export type Request = {
    TopP: number;
    Temperature: number;
    Messages: Content[];
  };

  export type Content = {
    Role: Role;
    Content: string;
  };

  export type Role = 'user' | 'assistant';

  /**
   * Response
   */
  export type Response = {
    Note: string;
    Choices: Choice[];
    Created: 1700549760;
    Id: string;
    Usage: { PromptTokens: 4; CompletionTokens: 2; TotalTokens: 6 };
  };

  export type Choice = {
    FinishReason: string;
    Delta: Content;
  };
}
