import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class AliyunQwenAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://dashscope.aliyuncs.com/api/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return [
      // free
      'qwen-vl-chat-v1',

      // cheap
      'qwen-turbo',
      'qwen-max',
      'qwen-max-1201',
      'qwen-max-longcontext',

      // paid
      'qwen-plus',
      'qwen-vl-plus',
    ];
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
      const isMultimodal = opts.model === 'qwen-vl-plus';
      const url = `${this.baseURL}/services/aigc/${isMultimodal ? 'multimodal' : 'text'}-generation/generation`;
      const params: types.aliyun.Request = await this.convertParams(options);
      // console.log(`[fetch]params`, JSON.stringify(params, null, 2));

      const res = await fetchSSE(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-SSE': 'enable',
        },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        throw new types.chat.ChatError(reason.message || 'request error', res.status);
      }

      // only get content from node-fetch
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

      // streaming
      const choicesList: types.chat.Choice[] = [];
      const useage: types.chat.Useage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const res = JSON.parse(event.data);
          // console.log(`->`, JSON.stringify(res));
          const choices = this.convertChoices(res.output.choices);
          onProgress?.(choices);

          if (res.usage) {
            const u = res.usage;
            Object.assign(useage, {
              prompt_tokens: u.input_tokens,
              completion_tokens: u.output_tokens,
              total_tokens: u.total_tokens ? u.total_tokens : u.input_tokens + u.output_tokens,
            });
          }
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
        resolove({ id: uuidv4(), model: opts.model, choices, useage });
      });
    });
  }

  /**
   * Aliyun Qwen API
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details
   * @returns
   */
  private async convertParams(opts: types.chat.SendOptions): Promise<types.aliyun.Request> {
    const params = {
      model: opts.model || 'qwen-turbo',
      input: {
        messages: await this.corvertContents(opts),
      },
      parameters: {
        top_p: opts.top_p || undefined,
        top_k: opts.top_k || undefined,
        incremental_output: true,
      },
    };
    // fix different model
    if (opts.model !== 'qwen-vl-plus') {
      Object.assign(params.parameters, {
        temperature: opts.temperature || 1,
        max_tokens: opts.max_tokens || 1500,
        enable_search: true,
        stop: opts.stop_sequences || undefined,
        result_format: 'message',
      });
    }
    return params;
  }

  private async corvertContents(opts: types.chat.SendOptions): Promise<types.aliyun.Content[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts: types.aliyun.Part[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            if (part.type === 'text') {
              parts.push({ text: part.text });
            }
            if (['image'].includes(part.type)) {
              parts.push({ image: (part as types.chat.FilePart).url });
            }
          }),
        );
        // fix different model
        let content: string | types.aliyun.Part[] = parts;
        if (!['qwen-vl-plus'].includes(opts.model)) {
          content = parts
            .map((item: any) => {
              return 'text' in item ? item.text : '';
            })
            .join('\n');
        }
        return { role: item.role, content: parts } as types.aliyun.Content;
      }),
    );
  }

  protected convertChoices(candidates: types.aliyun.Choice[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ message, finish_reason }: types.aliyun.Choice) => {
        const parts: types.chat.Part[] = [];
        // for text
        if (typeof message.content === 'string') {
          parts.push({ type: 'text', text: message.content });
        }
        // for multimodal
        if (typeof message.content === 'object' && message.content instanceof Array) {
          message.content.map((part: any) => {
            if ('text' in part) {
              parts.push({ type: 'text', text: part.text });
            }
          });
        }
        choices.push({ index: 0, role: 'assistant', parts, finish_reason: 'stop' });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
}
