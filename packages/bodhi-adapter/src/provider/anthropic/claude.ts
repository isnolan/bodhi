import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class AnthropicClaudeAPI extends ChatBaseAPI {
  protected provider: string = 'anthropic';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://generativelanguage.googleapis.com/v1' }, opts);
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
      const url = `${this.baseURL}/models/gemini-pro:streamGenerateContent?alt=sse`;
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
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
          // response.candidates.map((item: any) => {
          //   choice.push({
          //     index: item.index,
          //     delta: { content: item.content.parts[0] },
          //     finish_reason: item.finish_reason,
          //   });
          // });
          console.log(`[fetch]sse`, response);

          // onProgress?.(choice);
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
   * 转换为 Gemini 要求的请求参数
   * https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
   * @returns
   */
  private convertParams(opts: types.chat.SendOptions) {
    return {
      contents: {
        role: 'user',
        parts: [
          { part: 'text', text: '你好，我是小冰' }, // text
          // { inline_data: { mime_type: 'image/jpeg', data: image_base64_string } }, // image
          // { file: { uri: 'gs://bucket-name/path/to/file' } },  // file
          // { video_metadata: { start_offset: { seconds: 0, nanos: 0 }, end_offset: { seconds: 0, nanos: 0 } } }, // video
        ],
      },
      tools: [
        // {
        //   "functionDeclarations": [
        //     {
        //       "name": string,
        //       "description": string,
        //       "parameters": {
        //         object (OpenAPI Object Schema)
        //       }
        //     }
        //   ]
        // }
      ],
      safety_settings: [
        //
        { category: 'BLOCK_NONE', threshold: 'HARM_CATEGORY_UNSPECIFIED' },
      ],
      generationConfig: {
        temperature: 0.9, // gemini-pro:0.9, gemini-pro-vision:0.4
        topP: 30, // gemini-pro:none, gemini-pro-vision:32
        topK: 1.0,
        candidateCount: 1,
        maxOutputTokens: 2048, // gemini-pro:2048, gemini-pro-vision:8192
        stopSequences: [],
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
