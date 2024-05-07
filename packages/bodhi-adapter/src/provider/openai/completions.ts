import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';
import { openai } from './types';

export class OpenAICompletionsAPI extends ChatBaseAPI {
  protected provider: string = 'openai';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.openai.com/v1' }, opts);
    super(options);
  }

  public models(): string[] {
    return [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-16k',
      'gpt-3.5-turbo-instruct',
      'gpt-4',
      'gpt-4-0125-preview',
      'gpt-4-turbo-preview',
      'gpt-4-32k',
    ];
  }

  async sendMessage(opts: types.chat.SendOptions) {
    const { onProgress = () => {}, ...options } = opts;

    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params: openai.Request = await this.convertParams(options);
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
  private async convertParams(opts: types.chat.SendOptions): Promise<openai.Request> {
    const params: openai.Request = {
      model: opts.model || 'gpt-3.5-turbo-0125',
      messages: await this.corvertContents(opts),
      temperature: opts?.temperature || 0.9,
      top_p: opts?.top_p || 1,
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

  private async corvertContents(opts: types.chat.SendOptions): Promise<openai.Message[]> {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts: openai.Part[] = [];
        const tool_calls: openai.ToolCallPart[] = [];
        await Promise.all(
          item.parts.map(async (part: types.chat.Part) => {
            // text
            if (part.type === 'text') {
              parts.push({ type: 'text', text: part.text });
            }
            // file, only support image, now
            if (part.type === 'file' && part.mimetype?.startsWith('image')) {
              // TODO: fetch 下载图片并转化buffer为base64
              // parts.push({ type: 'image_url', image_url: (part as types.chat.FilePart).url });
              parts.push({ type: 'image_url', image_url: { url: (part as types.chat.FilePart).url } });
            }
            // tools
            if (part.type === 'function_call' && part.id) {
              const { name, args } = part.function_call;
              tool_calls.push({ id: part.id, type: 'function', function: { name, arguments: args } });
            }
          }),
        );
        if (item.role === 'system') {
          return { role: 'system', content: this.filterTextPartsToString(parts) } as openai.Message;
        }
        if (item.role === 'assistant') {
          return {
            role: 'assistant',
            content: parts,
            tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
          } as openai.Message;
        }
        return { role: 'user', content: parts } as openai.Message;
      }),
    );
  }

  private filterTextPartsToString(parts: openai.Part[]): string {
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as openai.TextPart).text)
      .join('');
  }

  protected convertChoices(candidates: openai.Choice[]): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      candidates.map(({ index, delta, message, finish_reason }: openai.Choice) => {
        const parts: types.chat.Part[] = [];
        let { content, tool_calls } = message || delta;
        if (delta) {
          content = delta.content;
          tool_calls = delta.tool_calls;
        }
        if (content) {
          parts.push({ type: 'text', text: content });
        }
        if (tool_calls) {
          tool_calls.map((call: any) => {
            const { name, arguments: args } = call.function;
            parts.push({ type: 'function_call', function_call: { name, args }, id: call.id });
          });
        }

        choices.push({ index, role: 'assistant', parts, finish_reason });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
}
