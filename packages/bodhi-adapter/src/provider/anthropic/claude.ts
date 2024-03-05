import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { claude } from './types';
import { ChatBaseAPI } from '../base';

export class AnthropicClaudeAPI extends ChatBaseAPI {
  protected provider: string = 'anthropic';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.anthropic.com' }, opts);
    super(options);
  }

  public models(): string[] {
    return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-2.1', 'claude-2.0', 'claude-instant-1.2'];
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
      const url = `${this.baseURL}/v1/messages`;
      const params: claude.Request = await this.convertParams(options);
      const res = await fetchSSE(url, {
        headers: {
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent(this.agent) : undefined,
        method: 'POST',
      });

      if (!res.ok) {
        const reason = await res.json();
        reject(new types.chat.ChatError(reason.error?.message || 'request error', res.status));
      }

      // only get content from node-fetch
      const body: NodeJS.ReadableStream = res.body;
      body.on('error', (err) => reject(new types.chat.ChatError(err.message, 500)));

      let response: types.chat.ChatResponse;
      const choicesList: types.chat.Choice[] = [];
      const parser = createParser((event: ParseEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const res: claude.Response = JSON.parse(event.data);
          response = this.convertResult(response, res);
          const choices = this.convertChoices(res);
          if (choices.length > 0) {
            onProgress?.(choices);
            choicesList.push(...choices);
          }
        }
      });
      body.on('readable', async () => {
        let chunk: string | Buffer;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });

      body.on('end', () => {
        response.choices = this.combineChoices(choicesList);
        resolove(response);
      });
    });
  }

  /**
   * https://docs.anthropic.com/claude/reference/messages-streaming
   * @returns
   */
  private async convertParams(opts: types.chat.SendOptions): Promise<claude.Request> {
    return {
      model: opts.model || 'claude-instant-1.2',
      messages: await this.corvertContents(opts),
      system: '',
      temperature: opts.temperature || 0.8,
      top_k: opts.top_k || 1,
      top_p: opts.top_p || 1,
      max_tokens: opts.max_tokens || 1024,
      // metadata:
      stop_sequences: opts.stop_sequences || [],
      stream: true,
    };
  }

  protected async corvertContents(opts: types.chat.SendOptions): Promise<claude.Content[]> {
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
        return { role: item.role, content: parts.join('\n') } as claude.Content;
      }),
    );
  }

  private convertResult(response, res: claude.Response): types.chat.ChatResponse {
    try {
      if (res.type === 'message_start') {
        const { message: m } = res;
        const { input_tokens: prompt_tokens, output_tokens: completion_tokens } = m.usage;
        response = {
          id: m.id,
          model: m.model,
          choices: [],
          usage: { prompt_tokens, completion_tokens, total_tokens: prompt_tokens + completion_tokens },
        };
      }

      if (res.type === 'message_delta') {
        const { output_tokens } = res.usage;
        response.usage.completion_tokens = output_tokens;
        response.usage.total_tokens = response.usage.prompt_tokens + output_tokens;
      }
    } catch (err) {
      console.warn(err);
    }
    return response;
  }

  private convertChoices(res: claude.Response): types.chat.Choice[] {
    const choices: types.chat.Choice[] = [];
    try {
      if (res.type === 'content_block_start') {
        const { index, content_block: c } = res;
        choices.push({ index, role: 'assistant', parts: [{ type: 'text', text: c.text }], finish_reason: null });
      }

      if (res.type === 'content_block_delta') {
        const { index, delta: d } = res;
        choices.push({ index, role: 'assistant', parts: [{ type: 'text', text: d.text }], finish_reason: null });
      }

      if (res.type === 'content_block_stop') {
        const { index } = res;
        choices.push({ index, role: 'assistant', parts: [], finish_reason: 'stop' });
      }
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
}
