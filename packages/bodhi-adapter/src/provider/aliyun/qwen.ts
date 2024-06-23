import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';
import { aliyun } from './types';

export class AliyunQwenAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://dashscope.aliyuncs.com/api/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['qwen-turbo', 'qwen-plus', 'qwen-max'];
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
      // 如果消息存在图片, 则自动切换到 multimodal
      const isMulti =
        opts.model !== 'qwen-turbo' &&
        opts.messages.some((item) => item.parts.some((part) => ['image'].includes(part.type)));
      const model = isMulti ? opts.model.replace('-', '-vl-') : opts.model;
      const url = `${this.baseURL}/services/aigc/${isMulti ? 'multimodal' : 'text'}-generation/generation`;
      const params: aliyun.Request = await this.convertParams(model, options);
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
        reject(new types.chat.ChatError(reason.message || 'request error', res.status));
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
          // console.log(`->`, JSON.stringify(res));
          // success
          if (res?.output) {
            const choices = this.convertChoices(res.output.choices);
            onProgress?.(choices);

            if (res.usage) {
              const u = res.usage;
              Object.assign(usage, {
                prompt_tokens: u.input_tokens,
                completion_tokens: u.output_tokens,
                total_tokens: u.total_tokens ? u.total_tokens : u.input_tokens + u.output_tokens,
              });
            }
            choicesList.push(...choices);
          }

          // error
          if (res?.code) {
            reject(new types.chat.ChatError(res?.message, 500));
          }
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
        resolove({ id: uuidv4(), model: opts.model, choices, usage });
      });
    });
  }

  /**
   * Aliyun Qwen API
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details
   * @returns
   */
  private async convertParams(model, opts: types.chat.SendOptions): Promise<aliyun.Request> {
    const params = {
      model: model || 'qwen-turbo',
      input: {
        messages: await this.corvertContents(opts),
      },
      parameters: {
        temperature: (opts.temperature || 0.85) * 2 - 0.1,
        top_p: opts.top_p < 0 || opts.top_p >= 1 ? 0.8 : opts.top_p,
        // top_k: Math.round((opts.top_k || 0.025) * 100) || undefined,
        max_tokens: opts.max_tokens || 1500,
        incremental_output: true,
        enable_search: true,
      },
    };
    // fix different model
    if (model.indexOf('vl') === -1) {
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

  private async corvertContents(opts: types.chat.SendOptions): Promise<aliyun.Content[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts: aliyun.Part[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            // text
            if (part.type === 'text') {
              parts.push({ text: part.text });
            }
            // file: docs
            if (part.type === 'file' && part?.extract) {
              parts.push({ text: part.extract });
            }

            // file, only support image, now
            if (part.type === 'file' && part.mimetype?.startsWith('image')) {
              parts.push({ image: (part as types.chat.FilePart).url });
            }
          }),
        );
        // fix different model
        let content: string | aliyun.Part[] = parts;
        if (!['qwen-vl-plus'].includes(opts.model)) {
          content = parts
            .map((item: any) => {
              return 'text' in item ? item.text : '';
            })
            .join('\n');
        }
        return { role: item.role, content: parts } as aliyun.Content;
      }),
    );
  }

  protected convertChoices(candidates: aliyun.Choice[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ message, finish_reason }: aliyun.Choice) => {
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
