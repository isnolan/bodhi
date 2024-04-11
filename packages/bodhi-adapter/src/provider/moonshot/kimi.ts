import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';
import { kimi } from './types';

export class MoonshotKimiAPI extends ChatBaseAPI {
  protected provider: string = 'moonshot';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.moonshot.cn/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
  }

  async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;

    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params: kimi.Request = await this.convertParams(options);
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

        const choicesList: types.chat.Choice[] = [];
        const parser = createParser((event: ParseEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                const res = JSON.parse(event.data);
                const choices = this.convertChoices(res.choices);
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

        // console.log(`->`, choicesList);
        body.on('end', async () => {
          const choices: types.chat.Choice[] = this.combineChoices(choicesList);
          // TODO: Google AI Gemini not found usageMetadata, but vertex founded.
          const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          resolove({ id: uuidv4(), model: opts.model, choices, usage });
        });
      }
    });
  }

  /**
   * 转换为 Gemini 要求的请求参数
   * https://platform.openai.com/docs/api-reference/chat/create
   * @returns
   */
  private async convertParams(opts: types.chat.SendOptions): Promise<kimi.Request> {
    const params: kimi.Request = {
      model: opts.model || 'moonshot-v1-8k',
      messages: await this.corvertContents(opts),
      temperature: opts?.temperature || 0.9,
      top_p: opts?.top_p || 1.0,
      // frequency_penalty: 0,
      // presence_penalty: 0,
      max_tokens: opts?.max_tokens || 1000,
      n: opts.n || 1,
      stop: opts?.stop_sequences || undefined,
      stream: true,
    };
    // tools
    if (opts.tools && opts.tools.length > 0) {
      Object.assign(params, { tools: opts.tools, stream: false });
    }
    return params;
  }

  private async corvertContents(opts: types.chat.SendOptions): Promise<kimi.Message[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts: string[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            if (part.type === 'text') {
              parts.push(part.text);
            }
          }),
        );

        return { role: item.role, content: parts.join('\n') } as kimi.Message;
      }),
    );
  }

  protected convertChoices(candidates: kimi.Choice[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ index, delta, message, finish_reason }: kimi.Choice) => {
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
