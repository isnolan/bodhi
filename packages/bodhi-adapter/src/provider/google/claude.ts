import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { claude } from './types';
import { ChatBaseAPI } from '../base';

export class GoogleClaudeAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    // available models: claude-instant-1p2(100K tokens), claude-2p0(200K tokens)
    // available regions: us-central1(60QPM), asia-southeast1(60QPM)
    const options = Object.assign({ baseURL: 'https://us-central1-aiplatform.googleapis.com/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['claude-instant-1p2', 'claude-2p0'];
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
      const hasMedia = opts.messages.some((item) =>
        item.parts.some((part) => part.type === 'image' || part.type === 'video'),
      );
      const model = hasMedia ? 'gemini-pro-vision' : opts.model || 'gemini-pro';
      const url = `${this.baseURL}/projects/darftai/locations/us-central1/publishers/anthropic/models/${model}:streamRawPredict?alt=sse`;
      const params: claude.Request = await this.convertParams(options);
      console.log(`[fetch]url`, url);
      console.log(`[fetch]params`, JSON.stringify(params, null, 2));

      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        console.log(`->`, reason, res.status);
        reject(new types.chat.ChatError(reason.error?.message || 'request error', res.status));
      }

      // only get content from node-fetch
      let response: any;
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

      // streaming
      const choicesList: types.chat.Choice[] = [];
      const usage: types.chat.Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        // console.log(`->`, event.type, event?.data);
        if (event.type === 'event') {
          const res = JSON.parse(event.data);
          console.log(`->`, res);
          // const choices = this.convertChoices(res.candidates);
          // if (res.usageMetadata) {
          //   Object.assign(usage, {
          //     prompt_tokens: res.usageMetadata.promptTokenCount,
          //     completion_tokens: res.usageMetadata.candidatesTokenCount,
          //     total_tokens: res.usageMetadata.totalTokenCount,
          //   });
          // }
          // onProgress?.(choices);
          // choicesList.push(...choices);
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

  /**
   * Claude docs
   * https://docs.anthropic.com/claude/reference/messages_post
   * @returns
   */
  protected async convertParams(opts: types.chat.SendOptions): Promise<claude.Request> {
    return {
      system: '',
      messages: await this.corvertContents(opts),
      temperature: opts.temperature || 0.8,
      top_p: opts.top_p || 0,
      top_k: opts.top_k || 0,
      max_tokens: opts.max_tokens || 1024,
      stop_sequences: opts.stop_sequences || [],
      stream: true,

      anthropic_version: 'vertex-2023-10-16',
      anthropic_beta: ['private-messages-testing'],
    };
  }

  protected async corvertContents(opts: types.chat.SendOptions): Promise<claude.Content[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const content: string[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            if (part.type === 'text') {
              content.push(part.text);
            }
          }),
        );
        return { role: item.role, content: content.join('\n') } as claude.Content;
      }),
    );
  }
}
