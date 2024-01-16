import * as types from '@/types';

export namespace gemini {
  /**
   * Request
   */
  export type Request = {
    contents: Content[];
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

  export type Role = 'user' | 'model' | '';

  export type Part = TextPart | FilePart | ToolPart;
  export type TextPart = { text: string };
  export type FilePart = { inline_data: { mime_type: string; data: string } };
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
