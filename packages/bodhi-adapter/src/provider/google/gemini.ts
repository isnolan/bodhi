import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class GoogleGeminiAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://generativelanguage.googleapis.com/v1beta' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['gemini-pro', 'gemini-pro-vision'];
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
      const model = opts.model || 'gemini-pro';
      const url = `${this.baseURL}/models/${model}:streamGenerateContent?alt=sse`;
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(this.convertParams(options)),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });
      // console.log(`[fetch]result`, res);

      if (!res.ok) {
        const reason = await res.json();
        throw new types.chat.ChatError(reason.error?.message || 'request error', res.status);
      }

      // only get content from node-fetch
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));
      let response: any;
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          response = JSON.parse(event.data);

          // 整理数据
          // const choice: types.chat.Choice[] = [];
          // response.candidates.map((item: any) => {
          //   choice.push({
          //     index: item.index,
          //     delta: { content: item.content.parts[0] },
          //     finish_reason: item.finish_reason,
          //   });
          // });
          // console.log(`[fetch]->`, JSON.stringify(response.candidates, null, 2));

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
   * 转换为 Gemini 要求的请求参数
   * https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
   * @returns
   */
  private convertParams(opts: types.chat.SendOptions) {
    return {
      contents: opts.messages,
      // contents: [
      // {
      //   role: 'user',
      //   parts: [
      //     { part: 'text', text: '你好，我是小冰' }, // text
      //     { inline_data: { mime_type: 'image/jpeg', data: image_base64_string } }, // image
      //     { file: { uri: 'gs://bucket-name/path/to/file' } }, // file
      //     { video_metadata: { start_offset: { seconds: 0, nanos: 0 }, end_offset: { seconds: 0, nanos: 0 } } }, // video
      //   ],
      // },
      // { role: 'user', parts: [{ text: 'Hello, 我们家有两只狗' }] },
      // { role: 'model', parts: [{ text: 'Great to meet you. What would you like to know?' }] },
      // { role: 'user', parts: [{ text: '请写一篇关于我家小狗子的故事，要求不少于100字' }] },
      // function call
      // { role: 'user', parts: { text: 'Which theaters in Mountain View show Barbie movie?' } },
      // ],
      tools: [
        // {
        //   function_declarations: [
        //     {
        //       name: 'find_theaters',
        //       description:
        //         'find theaters based on location and optionally movie title which are is currently playing in theaters',
        //       parameters: {
        //         type: 'object',
        //         properties: {
        //           location: {
        //             type: 'string',
        //             description: 'The city and state, e.g. San Francisco, CA or a zip code e.g. 95616',
        //           },
        //           movie: { type: 'string', description: 'Any movie title' },
        //         },
        //         required: ['location'],
        //       },
        //     },
        //   ],
        // },
      ],
      safety_settings: [
        // { category: 'BLOCK_NONE', threshold: 'HARM_CATEGORY_UNSPECIFIED' },
      ],
      generationConfig: {
        temperature: opts.temperature || 0.9, // gemini-pro:0.9, gemini-pro-vision:0.4
        topP: opts.top_p || undefined, // gemini-pro:none, gemini-pro-vision:32
        topK: opts.top_k || undefined,
        candidateCount: opts.n || 1,
        maxOutputTokens: opts.max_tokens || 2048, // gemini-pro:2048, gemini-pro-vision:8192
        stopSequences: opts.stop_sequences || undefined,
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
