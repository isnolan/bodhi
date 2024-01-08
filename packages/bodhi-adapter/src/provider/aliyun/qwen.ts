import fetchSSE from 'node-fetch';
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
    return ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-1201', 'qwen-max-longcontext', 'qwen-vl-plus'];
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
      const url = `${this.baseURL}/services/aigc/text-generation/generation`;
      const res = await fetchSSE(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-SSE': 'enable',
        },
        body: JSON.stringify(this.convertParams(options)),
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
      let response: any;
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          response = JSON.parse(event.data);
          onProgress?.(response);
        }
      });
      body.on('readable', async () => {
        let chunk: string | Buffer;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });

      body.on('end', () => {
        resolove(response);
      });
    });
  }

  /**
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details
   * @returns
   */
  private convertParams(opts: types.chat.SendOptions) {
    return {
      model: opts.model || 'qwen-turbo',
      input: {
        messages: opts.messages,
      },
      parameters: {
        temperature: opts.temperature || 1,
        top_p: opts.top_p || undefined,
        top_k: opts.top_k || undefined,
        max_tokens: opts.max_tokens || 1500,
        stop: opts.stop_sequences || undefined,
        enable_search: true,
        incremental_output: true,
      },
    };
  }

  // 将 Gemini 的结果转换为你的数据格式
  private convertResult(result: any) {
    return {
      // 根据你的数据格式，从 Gemini 的结果中提取数据
      history: result.contents,
      // 其他数据...
    };
  }
}
