import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class AnthropicClaudeAPI extends ChatBaseAPI {
  protected provider: string = 'anthropic';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.anthropic.com' }, opts);
    super(options);
  }

  /**
   * Send message
   * https://docs.anthropic.com/claude/reference/messages_post
   * @param opts
   * @returns
   */
  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/v1/messages`;
      const res = await fetchSSE(url, {
        headers: {
          'Content-Type': 'application/json',
          'Anthropic-Beta': 'messages-2023-12-15',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(this.convertParams(options)),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason[0].error?.message || 'request error', res.status));
      }

      // only get content from node-fetch
      let response: any;
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

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
   * https://docs.anthropic.com/claude/reference/messages-streaming
   * @returns
   */
  private convertParams(opts: types.chat.SendOptions) {
    return {
      model: opts.model || 'claude-instant-1.2',
      messages: opts.messages || [],
      temperature: opts.temperature || 0.8,
      top_k: opts.top_k || 0,
      top_p: opts.top_p || 0,
      max_tokens: opts.max_tokens || 1024,
      stop_sequences: opts.stop_sequences || [],
      stream: true,
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
