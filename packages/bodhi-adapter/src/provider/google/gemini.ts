import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { gemini } from './types';
import { ChatBaseAPI } from '../base';

export class GoogleGeminiAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://generativelanguage.googleapis.com/v1beta' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['gemini-pro', 'gemini-pro-vision'];
  }

  /**
   *
   * https://ai.google.dev/docs/gemini_api_overview?hl=zh-cn#curl_3
   * @param opts
   * @returns
   */
  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const model = opts.model || 'gemini-pro';
      const url = `${this.baseURL}/models/${model}:streamGenerateContent?alt=sse`;
      const params: gemini.Request = await this.convertParams(options);
      // console.log(`[fetch]params`, JSON.stringify(params, null, 2));

      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });
      // console.log(`[fetch]result`, res);

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason.error?.message || 'request error', res.status));
      }

      // only get content from node-fetch
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

      // streaming
      const choicesList: types.chat.Choice[] = [];
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const res = JSON.parse(event.data);
          // console.log(`->`, JSON.stringify(res));
          const choices = this.convertChoices(res.candidates);
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

      body.on('end', () => {
        const choices: types.chat.Choice[] = this.combineChoices(choicesList);
        // TODO: Google AI Gemini not found usageMetadata, but vertex founded.
        const useage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        resolove({ id: uuidv4(), model: opts.model, choices, useage });
      });
    });
  }

  /**
   * 转换为 Gemini 要求的请求参数
   * https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
   * @returns
   */
  protected async convertParams(opts: types.chat.SendOptions): Promise<gemini.Request> {
    return {
      contents: await this.corvertContents(opts),
      tools: this.corvertTools(opts),
      safety_settings: [
        // { category: 'BLOCK_NONE', threshold: 'HARM_CATEGORY_UNSPECIFIED' },
      ],
      generationConfig: {
        temperature: opts.temperature || 0.9, // gemini-pro:0.9, gemini-pro-vision:0.4
        topP: opts.top_p || undefined, // gemini-pro:none, gemini-pro-vision:32
        topK: opts.top_k || undefined,
        candidateCount: opts.n || 1,
        maxOutputTokens: opts.max_tokens || 2048, // gemini-pro:2048, gemini-pro-vision:8192
        stopSequences: opts.stop_sequences || undefined,
      },
    };
  }

  private async corvertContents(opts: types.chat.SendOptions): Promise<gemini.Content[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts: gemini.Part[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            if (part.type === 'text') {
              parts.push({ text: part.text });
            }
            if (['image', 'video'].includes(part.type)) {
              // TODO: fetch 下载图片并转化buffer为base64
              const inline_data = await this.fetchFile((part as types.chat.FilePart).url);
              parts.push({ inline_data });
            }
            if (part.type === 'function_call') {
              parts.push({ functionCall: { name: part.name, args: part.args } });
            }
          }),
        );
        item.role = item.role === 'assistant' ? 'model' : item.role;

        return { role: item.role, parts } as gemini.Content;
      }),
    );
  }

  protected corvertTools(opts: types.chat.SendOptions): gemini.Tools[] {
    const tools: gemini.Tools[] = [];
    if (opts.tools) {
      opts.tools.map((item) => {
        if (item.type === 'function') {
          tools.push({ functionDeclarations: [item.function] });
        }
      });
    }
    return tools;
  }

  protected convertChoices(candidates: gemini.Candidate[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ index, content, finishReason }: gemini.Candidate) => {
        const parts: types.chat.Part[] = [];
        content.parts.map((part: any) => {
          if ('text' in part) {
            parts.push({ type: 'text', text: part.text });
          }
          if ('functionCall' in part) {
            parts.push({ type: 'function', function: part.functionCall });
          }
          // if (part.inline_data) {
          //   parts.push({ type: 'image', url: part.inline_data.data });
          // }
        });
        choices.push({ index, role: 'assistant', parts, finish_reason: 'stop' });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
}
