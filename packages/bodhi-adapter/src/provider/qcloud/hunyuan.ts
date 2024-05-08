import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';
import { hunyuan } from './types';

export class QcloudHunyuanAPI extends ChatBaseAPI {
  protected provider: string = 'tencent';
  private client: any;

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://hunyuan.tencentcloudapi.com' }, opts);
    super(options);

    // init tencentcloud client
    this.client = new tencentcloud.hunyuan.v20230901.Client({
      credential: { secretId: this.apiKey, secretKey: this.apiSecret },
      profile: {
        signMethod: 'TC3-HMAC-SHA256',
        httpProfile: { reqMethod: 'POST', reqTimeout: 30, endpoint: 'hunyuan.tencentcloudapi.com' },
      },
    });
  }

  public models(): string[] {
    return ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'];
  }

  /**
   * tencent hunyuan
   * https://cloud.tencent.com/document/api/1729/101836
   * @param opts
   * @returns
   */
  public async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      if (!this.models().includes(opts.model)) {
        reject(new Error(`model ${opts.model} is not supported`));
      }

      const params = await this.convertParams(options);
      const response = await this.client.ChatCompletions(params);

      // streaming
      let id = uuidv4();
      const choicesList: types.chat.Choice[] = [];
      const usage: types.chat.Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      for await (let message of response) {
        const res = JSON.parse(message.data);
        id = res.Id;
        const choices = this.convertChoices(res.Choices);
        if (res.Usage) {
          Object.assign(usage, {
            prompt_tokens: res.Usage.PromptTokens,
            completion_tokens: res.Usage.CompletionTokens,
            total_tokens: res.Usage.TotalTokens,
          });
        }
        onProgress?.(choices);
        choicesList.push(...choices);
      }

      // finished
      const choices: types.chat.Choice[] = this.combineChoices(choicesList);
      resolove({ id, model: opts.model, choices, usage });
    });
  }

  /**
   * 转换请求参数
   * @returns
   */
  private async convertParams(opts: types.chat.SendOptions) {
    return {
      Model: opts.model,
      TopP: opts.top_p || 1.0,
      Temperature: opts.temperature || 1.0,
      Messages: await this.corvertContents(opts),
      Stream: true,
    };
  }

  private async corvertContents(opts: types.chat.SendOptions): Promise<hunyuan.Content[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts: string[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            // text
            if (part.type === 'text') {
              parts.push(part.text);
            }
            // file, only support image, now
            if (part.type === 'file' && part?.extract) {
              parts.push(part.extract);
            }
          }),
        );
        return { Role: item.role, Content: parts.join('/n') } as hunyuan.Content;
      }),
    );
  }

  protected convertChoices(candidates: hunyuan.Choice[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ Delta, FinishReason }: hunyuan.Choice, index) => {
        const parts: types.chat.Part[] = [];
        parts.push({ type: 'text', text: Delta.Content });
        choices.push({ index, role: 'assistant', parts, finish_reason: 'stop' });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
}
