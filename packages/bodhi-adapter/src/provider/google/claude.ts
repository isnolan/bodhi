import fetchSSE from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { claude } from '../anthropic/types';
import { ChatBaseAPI } from '../base';

export class GoogleClaudeAPI extends ChatBaseAPI {
  protected provider: string = 'google';

  constructor(opts: types.chat.ChatOptions) {
    // available models: claude-instant-1p2(100K tokens), claude-2p0(200K tokens)
    // available regions: us-central1(60QPM), asia-southeast1(60QPM)
    const options = Object.assign(
      { baseURL: 'https://us-central1-aiplatform.googleapis.com/v1/projects/bodhi-415003/locations/us-central1' },
      opts,
    );
    super(options);
  }

  /**
   * 根据服务账号获取 access token
   */
  private async getToken(): Promise<string> {
    const auth: GoogleAuth = new GoogleAuth({
      credentials: { client_email: this.apiKey, private_key: this.apiSecret },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return (await auth.getAccessToken()) as string;
  }

  public models(): string[] {
    return ['claude-3-sonnet@20240229', 'claude-3-haiku@20240307', 'gemini-1.5-flash-preview-0514'];
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
      const token = await this.getToken();
      const url = `${this.baseURL}/publishers/anthropic/models/${opts.model}:streamRawPredict?alt=sse`;
      const params: claude.Request = await this.convertParams(options);
      // console.log(`->url`, url, JSON.stringify(params));
      const res = await fetchSSE(url, {
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
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
      messages: await this.corvertContents(opts),
      system: this.corvertSystem(opts),
      temperature: opts.temperature || 0.8,
      top_p: opts.top_p || 1,
      // top_k: opts.top_k || 1,
      max_tokens: opts.max_tokens || 1024,
      stop_sequences: opts.stop_sequences || [],
      stream: true,
      anthropic_version: 'vertex-2023-10-16',
    };
  }

  protected corvertSystem(opts: types.chat.SendOptions): string {
    return opts.messages
      .filter((item) => item.role === 'system')
      .map((item) =>
        item.parts
          .filter((p: types.chat.Part) => p.type === 'text')
          .map((p) => (p as types.chat.TextPart).text)
          .join(''),
      )
      .join('\n');
  }

  protected async corvertContents(opts: types.chat.SendOptions): Promise<claude.Content[]> {
    return Promise.all(
      opts.messages
        .filter((item) => item.role !== 'system')
        .map(async (item) => {
          const parts: claude.Part[] = [];
          await Promise.all(
            item.parts.map(async (part: types.chat.Part) => {
              // text
              if (part.type === 'text') {
                parts.push({ type: 'text', text: part.text });
              }
              // file, only support image, now
              if (part.type === 'file' && part?.extract) {
                parts.push({ type: 'text', text: part.extract });
              }
              if (part.type === 'file' && part.mimetype?.startsWith('image')) {
                try {
                  const { mimeType: media_type, data } = await this.fetchFile((part as types.chat.FilePart).url);
                  parts.push({ type: 'image', source: { type: 'base64', media_type, data } });
                } catch (err) {
                  // console.warn(``);
                }
              }
            }),
          );
          return { role: item.role, content: parts } as claude.Content;
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
