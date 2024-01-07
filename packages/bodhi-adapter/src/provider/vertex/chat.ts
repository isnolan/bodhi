import fetchSSE from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class ChatVertexAPI extends ChatBaseAPI {
  protected provider: string = 'gemini';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://asia-southeast1-aiplatform.googleapis.com/v1' }, opts);
    super(options);
  }

  /**
   * 根据服务账号获取 access token
   */
  private async getToken(): Promise<string> {
    const auth: GoogleAuth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return (await auth.getAccessToken()) as string;
  }

  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {} } = opts;

    return new Promise(async (resolove, reject) => {
      const token = await this.getToken();
      const url = `${this.baseURL}/projects/darftai/locations/asia-southeast1/publishers/google/models/gemini-pro:streamGenerateContent?alt=sse`;
      const res = await fetchSSE(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          //     'client_library_language': CLIENT_INFO.client_library_language,
          // 'client_library_version': CLIENT_INFO.client_library_version,
        },
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
            choice.push(item.content);
          });
          console.log(`[fetch]sse`, JSON.stringify(choice, null, 2));

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
