import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';
import { deepseek } from './types';

export class DeepSeekAPI extends ChatBaseAPI {
  protected provider: string = 'moonshot';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.deepseek.com' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['deepseek-chat'];
  }

  async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;

    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params: deepseek.Request = await this.convertParams(options);
      // console.log(`[fetch]params`, JSON.stringify(params, null, 2));

      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason.error?.message || 'request error', res.status));
      }

      // not stream
      if (params.stream === false) {
        const result = await res.json();
        const choices = this.convertChoices(result.choices);
        const usage = result?.usage;
        resolove({ id: uuidv4(), model: opts.model, choices, usage });
      } else {
        // streaming
        const body: NodeJS.ReadableStream = res.body;
        body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

        let result;
        const choicesList: types.chat.Choice[] = [];
        const parser = createParser((event: ParseEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                result = JSON.parse(event.data);
                const choices = this.convertChoices(result.choices);
                onProgress?.(choices);
                choicesList.push(...choices);
              } catch (e) {
                // ignore
              }
            }
          }
        });
        body.on('readable', async () => {
          let chunk: string | Buffer;
          while ((chunk = body.read())) {
            parser.feed(chunk.toString());
          }
        });

        body.on('end', async () => {
          const choices: types.chat.Choice[] = this.combineChoices(choicesList);
          resolove({ id: uuidv4(), model: opts.model, choices, usage: result.usage });
        });
      }
    });
  }

  /**
   * https://platform.deepseek.com/api-docs/zh-cn/api/create-chat-completion/index.html
   * @returns
   */
  private async convertParams(opts: types.chat.SendOptions): Promise<deepseek.Request> {
    const params: deepseek.Request = {
      model: opts.model || 'moonshot-v1-8k',
      messages: await this.corvertContents(opts),
      temperature: opts?.temperature || 0.9,
      top_p: opts?.top_p || 1.0,
      // frequency_penalty: 0,
      // presence_penalty: 0,
      max_tokens: opts?.max_tokens || 1000,
      // n: opts.n || 1,
      stop: opts?.stop_sequences || undefined,
      stream: true,
    };
    // tools
    if (opts.tools && opts.tools.length > 0) {
      Object.assign(params, { tools: opts.tools, stream: false });
    }
    return params;
  }

  private async corvertContents(opts: types.chat.SendOptions): Promise<deepseek.Message[]> {
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

        return { role: item.role, content: parts.join('\n') } as deepseek.Message;
      }),
    );
  }

  protected convertChoices(candidates: deepseek.Choice[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ index, delta, message, finish_reason }: deepseek.Choice) => {
        const parts: types.chat.Part[] = [];
        let { content } = message || delta;
        if (delta) {
          content = delta.content;
        }
        if (content) {
          parts.push({ type: 'text', text: content });
        }

        choices.push({ index, role: 'assistant', parts, finish_reason });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
}
