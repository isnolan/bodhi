import * as types from '@/types';

export namespace gemini {
  /**
   * Request
   */
  export type Request = {
    contents: Content[];
    systemInstruction?: Content;
    tools: Tools[];
    safety_settings: safetyRating[];
    generationConfig: {
      temperature: number;
      topP?: number;
      topK?: number;
      candidateCount: number;
      maxOutputTokens: number;
      stopSequences?: string[];
    };
  };

  export type Content = {
    role: Role;
    parts: Part[];
  };

  export type Role = 'user' | 'model';

  export type Part = TextPart | FilePart | ToolPart;
  export type TextPart = { text: string };
  export type FilePart = { inlineData: { mimeType: string; data: string } };
  export type ToolPart = { functionCall: { name: string; args: any } };

  export type Tools = { functionDeclarations: types.chat.Function[] };
  export type safetyRating = { category: string; probability: string };
  export type usageMetadata = { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };

  /**
   * Response
   */
  export type Response = {
    candidates: Candidate[];
    usageMetadata: usageMetadata;
  };

  export type Candidate = {
    content: { parts: Part[]; role: Role };
    finishReason: string;
    index: number;
    safetyRatings: safetyRating[];
  };
}

export namespace claude {
  /**
   * Request
   */
  export type Request = {
    system: string;
    messages: Content[];
    temperature: number;
    top_k: number;
    top_p: number;
    max_tokens: number;
    stop_sequences: string[];
    stream: boolean;

    anthropic_version: string;
    anthropic_beta: string[];
  };

  export type Content = {
    role: Role;
    content: string;
  };

  export type Role = 'user' | 'assistant';

  /**
   * Response
   */
  // export type Response = {
  //   candidates: Candidate[];
  //   usageMetadata: usageMetadata;
  // };

  // export type Candidate = {
  //   content: { parts: Part[]; role: Role };
  //   finishReason: string;
  //   index: number;
  //   safetyRatings: safetyRating[];
  // };
}
