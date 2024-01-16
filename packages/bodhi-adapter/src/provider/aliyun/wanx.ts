import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class AliyunWanxAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://dashscope.aliyuncs.com/api/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['wanx-v1'];
  }

  /**
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details-9
   * @param opts
   * @returns
   */
  public async sendMessage(opts: types.image.SendOptions) {
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/services/aigc/text2image/image-synthesis`;
      const res = await fetchSSE(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify(this.convertParams(opts)),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason.message || 'request error', res.status));
      }

      try {
        const { output } = await res.json();
        if (output.task_status === 'FAILED') {
          reject(new types.chat.ChatError(output.message, res.status));
        }
        resolove(output);
      } catch (err) {
        reject(new types.chat.ChatError('request error', res.status));
      }
    });
  }

  public async getTaskResult(task_id: string) {
    const url = `${this.baseURL}/tasks/${task_id}`;
    return new Promise(async (resolove, reject) => {
      const res = await fetchSSE(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
      });

      try {
        const { output } = await res.json();
        if (output.task_status === 'FAILED') {
          reject(new types.chat.ChatError(output.message, res.status));
        }

        resolove(output);
      } catch (err) {
        reject(new types.chat.ChatError('request error', res.status));
      }
    });
  }

  /**
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details-9
   * @returns
   */
  private convertParams(opts: types.image.SendOptions) {
    return {
      model: opts.model || 'wanx-v1',
      input: {
        prompt: opts.prompt,
      },
      parameters: {
        style: '<sketch>',
        size: '1024*1024',
        n: 4,
        seed: 42,
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
