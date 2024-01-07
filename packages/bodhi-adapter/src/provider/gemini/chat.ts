import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class ChatGeminiAPI extends ChatBaseAPI {
  protected provider: string = 'gemini';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://generativelanguage.googleapis.com/v1' }, opts);
    super(options);
  }

  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {} } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/models/gemini-pro:streamGenerateContent?alt=sse`;
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({ contents: opts.history }),
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
}
