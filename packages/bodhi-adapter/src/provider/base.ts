import { get_encoding } from 'tiktoken';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as types from '@/types';

export class ChatBaseAPI {
  protected provider: string = '';

  protected agent?: string = '';
  protected baseURL: string = '';
  protected apiKey: string = '';
  protected apiSecret?: string = '';
  protected timeout?: number = 10000;

  constructor(opts: types.chat.ChatOptions) {
    opts.agent && (this.agent = opts.agent);
    opts.baseURL && (this.baseURL = opts.baseURL);
    opts.apiKey && (this.apiKey = opts.apiKey);
    opts.apiSecret && (this.apiSecret = opts.apiSecret);
    opts.timeout && (this.timeout = opts.timeout);
  }

  public models(): string[] {
    throw new Error('Not implemented');
  }

  public async sendMessage(opts: types.chat.SendOptions | types.image.SendOptions): Promise<any> {
    throw new Error('Not implemented');
  }

  public async getTaskResult(task_id: string): Promise<any> {
    throw new Error('Not implemented');
  }

  protected async fetchFile(url: string) {
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
    });
    const buffer = await response.buffer();
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') as string;
    return { mimeType, data: base64 };
  }

  protected combineChoices(choices: types.chat.Choice[]): types.chat.Choice[] {
    return choices.reduce((acc: types.chat.Choice[], item: types.chat.Choice) => {
      const existingItem = acc.find((i: types.chat.Choice) => i.index === item.index);
      if (existingItem) {
        item.parts.forEach((part: types.chat.Part) => {
          if (part.type === 'text') {
            const existingPart = existingItem.parts.find((p: types.chat.Part) => p.type === 'text');
            if (existingPart) {
              (existingPart as types.chat.TextPart).text += (part as types.chat.TextPart).text;
            } else {
              existingItem.parts.push(part);
            }
          } else if (part.type === 'function_call') {
            const existingPart = existingItem.parts.find((p: types.chat.Part) => p.type === 'function_call');
            if (existingPart) {
              (existingPart as types.chat.FunctionCallTool).function_call.name +=
                (part as types.chat.FunctionCallTool).function_call.name || '';
              (existingPart as types.chat.FunctionCallTool).function_call.args +=
                (part as types.chat.FunctionCallTool).function_call.args || '';
            } else {
              existingItem.parts.push(part);
            }
          } else {
            const existingPart = existingItem.parts.find(
              (p: types.chat.Part) => JSON.stringify(p) === JSON.stringify(part),
            );
            if (!existingPart) {
              existingItem.parts.push(part);
            }
          }
        });

        // finish_reason
        existingItem.finish_reason = item.finish_reason;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  }

  protected caclulateUsage(messages: types.chat.Message[], choices: types.chat.Choice[]): types.chat.Usage {
    const parts: types.chat.Part[] = messages.flatMap((item) => item.parts);
    const prompt_tokens = parts
      .filter((p) => p.type === 'text' || (p.type === 'file' && p.extract))
      .reduce((acc: number, item) => {
        return acc + this.getTokenCount((item as types.chat.TextPart)?.text || (item as types.chat.FilePart)?.extract);
      }, 0);
    const completion_tokens = choices.reduce((acc: number, item: types.chat.Choice) => {
      return acc + this.getTokenCount(item.parts.map((part) => (part as types.chat.TextPart).text).join(''));
    }, 0);
    return { prompt_tokens, completion_tokens, total_tokens: prompt_tokens + completion_tokens };
  }

  protected getTokenCount(text: string) {
    return get_encoding('cl100k_base').encode(text).length;
  }
}
