import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { GoogleGeminiAPI } from './gemini';
import { gemini } from './types';

export class GoogleVertexAPI extends GoogleGeminiAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign(
      {
        baseURL: 'https://us-central1-aiplatform.googleapis.com/v1/projects/bodhi-415003/locations/us-central1',
      },
      opts,
    );
    super(options);
  }

  public models(): string[] {
    return ['gemini-1.0-pro', 'gemini-1.5-pro-preview-0409'];
  }

  /**
   * 根据服务账号获取 access token
   */
  private async getToken(): Promise<string> {
    const auth: GoogleAuth = new GoogleAuth({
      credentials: { client_email: this.apiKey, private_key: this.apiSecret },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return (await auth.getAccessToken()) as string;
  }

  /**
   * 发送消息
   * @param opts <types.chat.SendOptions>
   * Reference: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
   * Reference: https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini?hl=zh-cn
   * Multi-modal: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/send-multimodal-prompts?hl=zh-cn#gemini-send-multimodal-samples-drest
   * Tools: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling?hl=zh-cn
   * @returns
   */
  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;

    return new Promise(async (resolove, reject) => {
      const token = await this.getToken();
      // if have media, use gemini-pro-vision
      const hasFile = opts.messages.some((item) => item.parts.some((part) => part.type === 'file'));
      const model = hasFile && opts.model === 'gemini-1.0-pro' ? 'gemini-1.0-pro-vision' : opts.model;
      const url = `${this.baseURL}/publishers/google/models/${model}:streamGenerateContent?alt=sse`;
      const params: gemini.Request = await this.convertParams(options);
      console.log(`[fetch]params`, url, JSON.stringify(params, null, 2));

      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason.error?.message || 'request error', res.status));
      }

      // only get content from node-fetch
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

      // streaming
      const choicesList: types.chat.Choice[] = [];
      const usage: types.chat.Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const res = JSON.parse(event.data);
          const choices = this.convertChoices(res.candidates);
          if (res.usageMetadata) {
            Object.assign(usage, {
              prompt_tokens: res.usageMetadata.promptTokenCount,
              completion_tokens: res.usageMetadata.candidatesTokenCount,
              total_tokens: res.usageMetadata.totalTokenCount,
            });
          }
          onProgress?.(choices);
          choicesList.push(...choices);
        }
      });
      body.on('readable', async () => {
        let chunk: string | Buffer;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });

      // finished
      body.on('end', () => {
        const choices: types.chat.Choice[] = this.combineChoices(choicesList);
        // TODO: Google AI Gemini not found usageMetadata, but vertex founded.
        resolove({ id: uuidv4(), model: opts.model, choices, usage });
      });
    });
  }
}
