import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class OpenAICompletionsAPI extends ChatBaseAPI {
  protected provider: string = 'openai';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.openai.com/v1' }, opts);
    super(options);
  }

  async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;

    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(this.convertParams(options)),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        throw new types.chat.ChatError(reason.error?.message || 'request error', res.status);
      }

      // only get content from node-fetch
      let response: any;
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          if (event.data === '[DONE]') {
            resolove(response);
          } else {
            try {
              response = JSON.parse(event.data);
              onProgress?.(response);
            } catch (e) {
              // ignore
            }
          }

          // 整理数据
          // const choice: types.chat.Choice[] = [];
          // response.candidates.map((item: any) => {
          //   choice.push(item.content);
          // });
          // console.log(`[fetch]sse`, JSON.stringify(choice, null, 2));
        }
      });
      body.on('readable', async () => {
        let chunk: string | Buffer;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });

      body.on('end', () => {});
    });
  }

  /**
   * 转换为 Gemini 要求的请求参数
   * https://platform.openai.com/docs/api-reference/chat/create
   * @returns
   */
  private convertParams(opts: types.chat.SendOptions) {
    return {
      model: opts.model || 'gpt-3.5-turbo-1106',
      messages: opts.messages || [],
      // tools: opts?.tools,
      // tools: [
      //   {
      //     type: 'function',
      //     function: {
      //       name: 'get_current_weather',
      //       description: 'Get the current weather in a given location',
      //       parameters: {
      //         type: 'object',
      //         properties: {
      //           location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' },
      //           unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      //         },
      //         required: ['location'],
      //       },
      //     },
      //   },
      // ],
      temperature: opts?.temperature || 0.9,
      top_p: opts?.top_p || 1,
      n: opts.n || 1,
      max_tokens: opts?.max_tokens || null,
      stop: opts?.stop_sequences || null,
      stream: true,
    };
  }
}
