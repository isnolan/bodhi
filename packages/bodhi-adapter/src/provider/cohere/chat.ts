import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class ChatCohereAPI extends ChatBaseAPI {
  protected provider: string = 'cohere';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.cohere.ai/v1' }, opts);
    super(options);
  }

  /**
   * Cohere Support
   * https://docs.cohere.com/reference/customer-support
   * @param opts
   * @returns
   */
  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/classify`;
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(this.convertParams(options)),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        throw new types.chat.ChatError(reason[0].error?.message || 'request error', res.status);
      }

      // only get content from node-fetch
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));
      let response;
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          response = JSON.parse(event.data);

          // 整理数据
          const choice: types.chat.Choice[] = [];
          response.candidates.map((item: any) => {
            choice.push({
              index: item.index,
              delta: { content: item.content.parts[0] },
              finish_reason: item.finish_reason,
            });
          });
          console.log(`[fetch]sse`, choice);

          onProgress?.(choice);
        }
      });
      body.on('readable', async () => {
        let chunk: string | Buffer;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });

      body.on('end', () => {
        console.log(`[fetch]sse`, 'finished'); // finished
        resolove({});
      });
    });
  }

  /**
   * https://docs.cohere.com/reference/chat
   */
  private convertParams(opts: types.chat.SendOptions) {
    return {
      model: opts.model || 'command',
      chat_history: [
        { role: 'USER', message: 'Who discovered gravity?' },
        { role: 'CHATBOT', message: 'The man who is widely credited with discovering gravity is Sir Isaac Newton' },
      ],
      message: 'What year was he born?',
      temperature: opts.temperature || 0.3,
      connectors: [{ id: 'web-search' }],
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
