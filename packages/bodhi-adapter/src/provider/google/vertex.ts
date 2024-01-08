import fetchSSE from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class GoogleVertexAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://asia-southeast1-aiplatform.googleapis.com/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['gemini-pro', 'gemini-pro-vision', 'medlm-medium', 'medlm-large'];
  }

  /**
   * 根据服务账号获取 access token
   */
  private async getToken(): Promise<string> {
    const auth: GoogleAuth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    return (await auth.getAccessToken()) as string;
  }

  /**
   * 发送消息
   * @param opts <types.chat.SendOptions>
   * Reference: https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini?hl=zh-cn
   * Multi-modal: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/send-multimodal-prompts?hl=zh-cn#gemini-send-multimodal-samples-drest
   * Tools: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling?hl=zh-cn
   * @returns
   */
  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;

    return new Promise(async (resolove, reject) => {
      const token = await this.getToken();
      const url = `${this.baseURL}/projects/darftai/locations/asia-southeast1/publishers/google/models/gemini-pro:streamGenerateContent?alt=sse`;
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      tools: [],
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
