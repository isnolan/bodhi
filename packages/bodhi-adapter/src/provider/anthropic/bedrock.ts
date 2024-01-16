import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';
import { requestWithAuth, toUtf8 } from './auth';

export class AnthropicBedrockAPI extends ChatBaseAPI {
  protected provider: string = 'anthropic';

  constructor(opts: types.chat.ChatOptions) {
    super(Object.assign({ baseURL: `https://bedrock-runtime.ap-northeast-1.amazonaws.com` }, opts));
  }

  public models(): string[] {
    return ['anthropic.claude-v2:1', 'anthropic.claude-v2', 'anthropic.claude-v1', 'anthropic.claude-instant-v1'];
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
      const url = new URL(`${this.baseURL}/model/${opts.model}/invoke-with-response-stream`);
      // 预请求并签名
      const req = await requestWithAuth(
        { region: 'ap-northeast-1', service: 'bedrock', accessKeyId: this.apiKey, secretAccessKey: this.apiSecret },
        {
          method: 'POST',
          protocol: url.protocol,
          path: url.pathname,
          headers: {
            host: url.hostname,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'AnthropicBedrock/JS 0.6.1',
            'X-Stainless-Lang': 'js',
            'X-Stainless-Package-Version': '0.6.1',
            'X-Stainless-OS': 'MacOS',
            'X-Stainless-Arch': 'arm64',
            'X-Stainless-Runtime': 'node',
            'X-Stainless-Runtime-Version': 'v19.4.0',
          },
          body: JSON.stringify(this.convertParams(options), null, 2),
        },
      );
      // 请求
      const res = await fetchSSE(url, {
        headers: req.headers,
        body: req.body,
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: req.method,
      });

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason.message || 'request error', res.status));
      }

      // only get content from node-fetch
      let response: any;
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        // if (event.type === 'event') {
        // response = JSON.parse(event.data);
        // onProgress?.(response);
        // }
        console.log(`[bedrock]`, event);
      });

      body.on('readable', async () => {
        // 解析SSE 并进行utf8解码
        // let chunk: string | Buffer;
        // while ((chunk = body.read())) {
        //   console.log(`[bedrock]`, chunk.toString());
        //   // parser.feed(chunk.toString());
        // }

        let event;
        while (null !== (event = body.read())) {
          if (Buffer.isBuffer(event)) {
            console.log(`[bedrock]`, event.toString('utf8'));
          }
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
      prompt: '\n\nHuman: Hey Claude! How can I recursively list all files in a directory in Rust?\n\nAssistant:',
      temperature: 1,
      // top_k: 250,
      // top_p: 0.999,
      max_tokens_to_sample: 500,
      anthropic_version: 'bedrock-2023-05-31',
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
