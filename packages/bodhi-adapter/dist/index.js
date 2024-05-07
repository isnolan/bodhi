// src/types/provider.ts
var Provider = /* @__PURE__ */ ((Provider2) => {
  Provider2['GOOGLE_GEMINI'] = 'google-gemini';
  Provider2['GOOGLE_VERTEX'] = 'google-vertex';
  Provider2['GOOGLE_CLAUDE'] = 'google-claude';
  Provider2['OPENAI_COMPLETIONS'] = 'openai-completion';
  Provider2['OPENAI_ASSISTANTS'] = 'openai-assistant';
  Provider2['ANTHROPIC_CLAUDE'] = 'anthropic-claude';
  Provider2['ANTHROPIC_BEDROCK'] = 'anthropic-bedrock';
  Provider2['ALIYUN_QWEN'] = 'aliyun-qwen';
  Provider2['ALIYUN_WANX'] = 'aliyun-wanx';
  Provider2['QCLOUD_HUNYUAN'] = 'qcloud-hunyuan';
  Provider2['MOONSHOT_KIMI'] = 'moonshot-kimi';
  return Provider2;
})(Provider || {});

// src/provider/openai/completions.ts
import fetchSSE from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { HttpsProxyAgent as HttpsProxyAgent2 } from 'https-proxy-agent';
import { createParser } from 'eventsource-parser';

// src/types/chat.ts
var chat;
((chat2) => {
  class ChatError extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
    }
  }
  chat2.ChatError = ChatError;
})(chat || (chat = {}));

// src/provider/base.ts
import { get_encoding } from 'tiktoken';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
var ChatBaseAPI = class {
  constructor(opts) {
    this.provider = '';
    this.agent = '';
    this.baseURL = '';
    this.apiKey = '';
    this.apiSecret = '';
    this.timeout = 1e4;
    opts.agent && (this.agent = opts.agent);
    opts.baseURL && (this.baseURL = opts.baseURL);
    opts.apiKey && (this.apiKey = opts.apiKey);
    opts.apiSecret && (this.apiSecret = opts.apiSecret);
    opts.timeout && (this.timeout = opts.timeout);
  }
  models() {
    throw new Error('Not implemented');
  }
  async sendMessage(opts) {
    throw new Error('Not implemented');
  }
  async getTaskResult(task_id) {
    throw new Error('Not implemented');
  }
  async fetchFile(url) {
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      agent: this.agent ? new HttpsProxyAgent(this.agent) : void 0,
    });
    const buffer = await response.buffer();
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type');
    return { mimeType, data: base64 };
  }
  combineChoices(choices) {
    return choices.reduce((acc, item) => {
      const existingItem = acc.find((i) => i.index === item.index);
      if (existingItem) {
        item.parts.forEach((part) => {
          if (part.type === 'text') {
            const existingPart = existingItem.parts.find((p) => p.type === 'text');
            if (existingPart) {
              existingPart.text += part.text;
            } else {
              existingItem.parts.push(part);
            }
          } else if (part.type === 'function_call') {
            const existingPart = existingItem.parts.find((p) => p.type === 'function_call');
            if (existingPart) {
              existingPart.function_call.name += part.function_call.name || '';
              existingPart.function_call.args += part.function_call.args || '';
            } else {
              existingItem.parts.push(part);
            }
          } else {
            const existingPart = existingItem.parts.find((p) => JSON.stringify(p) === JSON.stringify(part));
            if (!existingPart) {
              existingItem.parts.push(part);
            }
          }
        });
        existingItem.finish_reason = item.finish_reason;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  }
  getTokenCount(text) {
    return get_encoding('cl100k_base').encode(text).length;
  }
};

// src/provider/openai/completions.ts
var OpenAICompletionsAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://api.openai.com/v1' }, opts);
    super(options);
    this.provider = 'openai';
  }
  models() {
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
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params = await this.convertParams(options);
      const res = await fetchSSE(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent2(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      if (params.stream === false) {
        const result = await res.json();
        const choices = this.convertChoices(result.choices);
        const usage = result?.usage;
        resolove({ id: uuidv4(), model: opts.model, choices, usage });
      } else {
        const body = res.body;
        body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
        const choicesList = [];
        const parser = createParser((event) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                const res2 = JSON.parse(event.data);
                const choices = this.convertChoices(res2.choices);
                onProgress?.(choices);
                choicesList.push(...choices);
              } catch (e) {}
            }
          }
        });
        body.on('readable', async () => {
          let chunk;
          while ((chunk = body.read())) {
            parser.feed(chunk.toString());
          }
        });
        body.on('end', async () => {
          const choices = this.combineChoices(choicesList);
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
  async convertParams(opts) {
    const params = {
      model: opts.model || 'gpt-3.5-turbo-0125',
      messages: await this.corvertContents(opts),
      temperature: opts?.temperature || 0.9,
      top_p: opts?.top_p || 1,
      // frequency_penalty: 0,
      // presence_penalty: 0,
      max_tokens: opts?.max_tokens || 1e3,
      n: opts.n || 1,
      stop: opts?.stop_sequences || void 0,
      stream: true,
    };
    if (opts.tools && opts.tools.length > 0) {
      Object.assign(params, { tools: opts.tools, stream: false });
    }
    return params;
  }
  async corvertContents(opts) {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts = [];
        const tool_calls = [];
        await Promise.all(
          item.parts.map(async (part) => {
            if (part.type === 'text') {
              parts.push({ type: 'text', text: part.text });
            }
            if (part.type === 'file' && part.mimetype?.startsWith('image')) {
              parts.push({ type: 'image_url', image_url: { url: part.url } });
            }
            if (part.type === 'function_call' && part.id) {
              const { name, args } = part.function_call;
              tool_calls.push({ id: part.id, type: 'function', function: { name, arguments: args } });
            }
          }),
        );
        if (item.role === 'system') {
          return { role: 'system', content: this.filterTextPartsToString(parts) };
        }
        if (item.role === 'assistant') {
          return {
            role: 'assistant',
            content: parts,
            tool_calls: tool_calls.length > 0 ? tool_calls : void 0,
          };
        }
        return { role: 'user', content: parts };
      }),
    );
  }
  filterTextPartsToString(parts) {
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }
  convertChoices(candidates) {
    const choices = [];
    try {
      candidates.map(({ index, delta, message, finish_reason }) => {
        const parts = [];
        let { content, tool_calls } = message || delta;
        if (delta) {
          content = delta.content;
          tool_calls = delta.tool_calls;
        }
        if (content) {
          parts.push({ type: 'text', text: content });
        }
        if (tool_calls) {
          tool_calls.map((call) => {
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
};

// src/provider/openai/assistants.ts
var OpenAIAssistantsAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://api.openai.com/v1' }, opts);
    super(options);
    this.provider = 'openai';
  }
};

// src/provider/google/vertex.ts
import fetchSSE3 from 'node-fetch';
import { v4 as uuidv43 } from 'uuid';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent as HttpsProxyAgent4 } from 'https-proxy-agent';
import { createParser as createParser3 } from 'eventsource-parser';

// src/provider/google/gemini.ts
import fetchSSE2 from 'node-fetch';
import { v4 as uuidv42 } from 'uuid';
import { HttpsProxyAgent as HttpsProxyAgent3 } from 'https-proxy-agent';
import { createParser as createParser2 } from 'eventsource-parser';
var GoogleGeminiAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://generativelanguage.googleapis.com/v1beta' }, opts);
    super(options);
    this.provider = 'google';
  }
  models() {
    return ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro-latest'];
  }
  /**
   *
   * https://ai.google.dev/docs/gemini_api_overview?hl=zh-cn#curl_3
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const params = await this.convertParams(options);
      const hasFile = opts.messages.some((item) => item.parts.some((part) => part.type === 'file'));
      const model = hasFile && opts.model === 'gemini-1.0-pro' ? 'gemini-pro-vision' : opts.model;
      const url = `${this.baseURL}/models/${model}:streamGenerateContent?alt=sse`;
      const res = await fetchSSE2(url, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent3(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      const choicesList = [];
      const parser = createParser2((event) => {
        if (event.type === 'event') {
          const res2 = JSON.parse(event.data);
          const choices = this.convertChoices(res2.candidates);
          onProgress?.(choices);
          choicesList.push(...choices);
        }
      });
      body.on('readable', async () => {
        let chunk;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });
      body.on('end', () => {
        const choices = this.combineChoices(choicesList);
        const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        resolove({ id: uuidv42(), model: opts.model, choices, usage });
      });
    });
  }
  /**
   * 转换为 Gemini 要求的请求参数
   * https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
   * @returns
   */
  async convertParams(opts) {
    return {
      contents: await this.corvertContents(opts),
      // systemInstruction: await this.corvertSystemContent(opts),
      tools: this.corvertTools(opts),
      safety_settings: [
        // { category: 'BLOCK_NONE', threshold: 'HARM_CATEGORY_UNSPECIFIED' },
      ],
      generationConfig: {
        temperature: opts.temperature || 0.9,
        // gemini-pro:0.9, gemini-pro-vision:0.4
        topP: opts.top_p || 1,
        // gemini-pro:none, gemini-pro-vision:32
        // topK: Math.round((opts.top_k || 0.025) * 40) || 32,
        candidateCount: opts.n || 1,
        maxOutputTokens: opts.max_tokens || 2048,
        // gemini-pro:2048, gemini-pro-vision:8192
        stopSequences: opts.stop_sequences || void 0,
      },
    };
  }
  async corvertContents(opts) {
    const rows = await Promise.all(
      opts.messages
        .filter((item) => ['user', 'assistant'].includes(item.role))
        .map(async (item) => {
          const parts = [];
          await Promise.all(
            item.parts.map(async (part) => {
              if (part.type === 'text') {
                parts.push({ text: part.text });
              }
              if (part.type === 'file') {
                const { mimetype: mimeType, url } = part;
                if (url.startsWith('gs://')) {
                  parts.push({ fileData: { mimeType, fileUri: url } });
                } else {
                  try {
                    parts.push({ inlineData: await this.fetchFile(url) });
                  } catch (err) {}
                }
              }
              if (part.type === 'function_call') {
                const { name, args } = part.function_call;
                parts.push({ functionCall: { name, args } });
              }
            }),
          );
          item.role = item.role === 'assistant' ? 'model' : item.role;
          return { role: item.role, parts };
        }),
    );
    const system = opts.messages.filter((item) => item.role === 'system');
    if (system.length > 0) {
      const textParts = system[0].parts.filter((part) => 'text' in part);
      rows[0].parts.unshift(
        ...textParts.map((part) => ({
          text: `[instructions]
${part.text}

[user prompt]
`,
        })),
      );
    }
    return rows;
  }
  corvertTools(opts) {
    const tools = [];
    if (opts.tools) {
      opts.tools.map((item) => {
        if (item.type === 'function') {
          tools.push({ functionDeclarations: [item.function] });
        }
      });
    }
    return tools;
  }
  convertChoices(candidates) {
    const choices = [];
    try {
      candidates.map(({ index, content, finishReason }) => {
        const parts = [];
        content.parts.map((part) => {
          if ('text' in part) {
            parts.push({ type: 'text', text: part.text });
          }
          if ('functionCall' in part) {
            parts.push({ type: 'function_call', function_call: part.functionCall });
          }
        });
        choices.push({ index, role: 'assistant', parts, finish_reason: 'stop' });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
};

// src/provider/google/vertex.ts
var GoogleVertexAPI = class extends GoogleGeminiAPI {
  constructor(opts) {
    const options = Object.assign(
      {
        baseURL: 'https://us-central1-aiplatform.googleapis.com/v1/projects/bodhi-415003/locations/us-central1',
      },
      opts,
    );
    super(options);
    this.provider = 'google';
  }
  models() {
    return ['gemini-1.0-pro', 'gemini-1.5-pro-preview-0409'];
  }
  /**
   * 根据服务账号获取 access token
   */
  async getToken() {
    const auth = new GoogleAuth({
      credentials: { client_email: this.apiKey, private_key: this.apiSecret },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return await auth.getAccessToken();
  }
  /**
   * 发送消息
   * @param opts <types.chat.SendOptions>
   * Reference: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
   * Reference: https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini?hl=zh-cn
   * Multi-modal: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/send-multimodal-prompts?hl=zh-cn#gemini-send-multimodal-samples-drest
   * Tools: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling?hl=zh-cn
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const token = await this.getToken();
      const hasFile = opts.messages.some((item) => item.parts.some((part) => part.type === 'file'));
      const model = hasFile && opts.model === 'gemini-1.0-pro' ? 'gemini-1.0-pro-vision' : opts.model;
      const url = `${this.baseURL}/publishers/google/models/${model}:streamGenerateContent?alt=sse`;
      const params = await this.convertParams(options);
      const res = await fetchSSE3(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent4(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      const choicesList = [];
      const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const parser = createParser3((event) => {
        if (event.type === 'event') {
          const res2 = JSON.parse(event.data);
          const choices = this.convertChoices(res2.candidates);
          if (res2.usageMetadata) {
            Object.assign(usage, {
              prompt_tokens: res2.usageMetadata.promptTokenCount,
              completion_tokens: res2.usageMetadata.candidatesTokenCount,
              total_tokens: res2.usageMetadata.totalTokenCount,
            });
          }
          onProgress?.(choices);
          choicesList.push(...choices);
        }
      });
      body.on('readable', async () => {
        let chunk;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });
      body.on('end', () => {
        const choices = this.combineChoices(choicesList);
        resolove({ id: uuidv43(), model: opts.model, choices, usage });
      });
    });
  }
};

// src/provider/google/claude.ts
import fetchSSE4 from 'node-fetch';
import { GoogleAuth as GoogleAuth2 } from 'google-auth-library';
import { HttpsProxyAgent as HttpsProxyAgent5 } from 'https-proxy-agent';
import { createParser as createParser4 } from 'eventsource-parser';
var GoogleClaudeAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign(
      { baseURL: 'https://us-central1-aiplatform.googleapis.com/v1/projects/bodhi-415003/locations/us-central1' },
      opts,
    );
    super(options);
    this.provider = 'google';
  }
  /**
   * 根据服务账号获取 access token
   */
  async getToken() {
    const auth = new GoogleAuth2({
      credentials: { client_email: this.apiKey, private_key: this.apiSecret },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return await auth.getAccessToken();
  }
  models() {
    return ['claude-3-sonnet@20240229', 'claude-3-haiku@20240307'];
  }
  /**
   * Send message
   * https://docs.anthropic.com/claude/reference/messages_post
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const token = await this.getToken();
      const url = `${this.baseURL}/publishers/anthropic/models/${opts.model}:streamRawPredict?alt=sse`;
      const params = await this.convertParams(options);
      console.log(`->url`, url, JSON.stringify(params));
      const res = await fetchSSE4(url, {
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent5(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      let response;
      const choicesList = [];
      const parser = createParser4((event) => {
        if (event.type === 'event') {
          const res2 = JSON.parse(event.data);
          response = this.convertResult(response, res2);
          const choices = this.convertChoices(res2);
          if (choices.length > 0) {
            onProgress?.(choices);
            choicesList.push(...choices);
          }
        }
      });
      body.on('readable', async () => {
        let chunk;
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
  async convertParams(opts) {
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
  corvertSystem(opts) {
    return opts.messages
      .filter((item) => item.role === 'system')
      .map((item) =>
        item.parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      )
      .join('\n');
  }
  async corvertContents(opts) {
    return Promise.all(
      opts.messages
        .filter((item) => item.role !== 'system')
        .map(async (item) => {
          const parts = [];
          await Promise.all(
            item.parts.map(async (part) => {
              if (part.type === 'text' || (part.type === 'file' && part?.text)) {
                parts.push({ type: 'text', text: part.text });
              }
              if (part.type === 'file' && part.mimetype?.startsWith('image')) {
                try {
                  const { mimeType: media_type, data } = await this.fetchFile(part.url);
                  parts.push({ type: 'image', source: { type: 'base64', media_type, data } });
                } catch (err) {}
              }
            }),
          );
          return { role: item.role, content: parts };
        }),
    );
  }
  convertResult(response, res) {
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
  convertChoices(res) {
    const choices = [];
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
};

// src/provider/anthropic/claude.ts
import fetchSSE5 from 'node-fetch';
import { HttpsProxyAgent as HttpsProxyAgent6 } from 'https-proxy-agent';
import { createParser as createParser5 } from 'eventsource-parser';
var AnthropicClaudeAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://api.anthropic.com' }, opts);
    super(options);
    this.provider = 'anthropic';
  }
  models() {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ];
  }
  /**
   * Send message
   * https://docs.anthropic.com/claude/reference/messages_post
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/v1/messages`;
      const params = await this.convertParams(options);
      const res = await fetchSSE5(url, {
        headers: {
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent6(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      let response;
      const choicesList = [];
      const parser = createParser5((event) => {
        if (event.type === 'event') {
          const res2 = JSON.parse(event.data);
          response = this.convertResult(response, res2);
          const choices = this.convertChoices(res2);
          if (choices.length > 0) {
            onProgress?.(choices);
            choicesList.push(...choices);
          }
        }
      });
      body.on('readable', async () => {
        let chunk;
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
  async convertParams(opts) {
    return {
      model: opts.model || 'claude-3-haiku-20240307',
      messages: await this.corvertContents(opts),
      system: this.corvertSystem(opts),
      temperature: opts.temperature || 0.8,
      top_p: opts.top_p || 1,
      // top_k: opts.top_k || 1,
      max_tokens: opts.max_tokens || 1024,
      // metadata:
      stop_sequences: opts.stop_sequences || [],
      stream: true,
    };
  }
  corvertSystem(opts) {
    return opts.messages
      .filter((item) => item.role === 'system')
      .map((item) =>
        item.parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      )
      .join('\n');
  }
  async corvertContents(opts) {
    return Promise.all(
      opts.messages
        .filter((item) => item.role !== 'system')
        .map(async (item) => {
          const parts = [];
          await Promise.all(
            item.parts.map(async (part) => {
              if (part.type === 'text') {
                parts.push({ type: 'text', text: part.text });
              }
              if (part.type === 'file' && part.mimetype?.startsWith('image')) {
                try {
                  const { mimeType: media_type, data } = await this.fetchFile(part.url);
                  parts.push({ type: 'image', source: { type: 'base64', media_type, data } });
                } catch (err) {}
              }
            }),
          );
          return { role: item.role, content: parts };
        }),
    );
  }
  convertResult(response, res) {
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
  convertChoices(res) {
    const choices = [];
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
};

// src/provider/anthropic/bedrock.ts
import fetchSSE6 from 'node-fetch';
import { HttpsProxyAgent as HttpsProxyAgent7 } from 'https-proxy-agent';
import { createParser as createParser6 } from 'eventsource-parser';

// src/provider/anthropic/auth.ts
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
async function requestWithAuth(options, request) {
  const { accessKeyId, secretAccessKey, region, service } = options;
  const credentials = { accessKeyId, secretAccessKey };
  const signed = await new SignatureV4({ region, service, sha256: Sha256, credentials }).sign(new HttpRequest(request));
  return signed;
}

// src/provider/anthropic/bedrock.ts
var AnthropicBedrockAPI = class extends ChatBaseAPI {
  constructor(opts) {
    super(Object.assign({ baseURL: `https://bedrock-runtime.ap-northeast-1.amazonaws.com` }, opts));
    this.provider = 'anthropic';
  }
  models() {
    return ['anthropic.claude-v2:1', 'anthropic.claude-v2', 'anthropic.claude-v1', 'anthropic.claude-instant-v1'];
  }
  /**
   * Send message
   * https://docs.anthropic.com/claude/reference/messages_post
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = new URL(`${this.baseURL}/model/${opts.model}/invoke-with-response-stream`);
      const req = await requestWithAuth(
        { region: 'ap-northeast-1', service: 'bedrock', accessKeyId: this.apiKey, secretAccessKey: this.apiSecret },
        {
          method: 'POST',
          protocol: url.protocol,
          path: url.pathname,
          headers: {
            host: url.hostname,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'AnthropicBedrock/JS 0.6.1',
            'X-Stainless-Lang': 'js',
            'X-Stainless-Package-Version': '0.6.1',
            'X-Stainless-OS': 'MacOS',
            'X-Stainless-Arch': 'arm64',
            'X-Stainless-Runtime': 'node',
            'X-Stainless-Runtime-Version': 'v19.4.0',
          },
          body: JSON.stringify(this.convertParams(options), null, 2),
        },
      );
      const res = await fetchSSE6(url, {
        headers: req.headers,
        body: req.body,
        agent: this.agent ? new HttpsProxyAgent7(this.agent) : void 0,
        method: req.method,
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.message || 'request error', res.status));
      }
      let response;
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      const parser = createParser6((event) => {
        console.log(`[bedrock]`, event);
      });
      body.on('readable', async () => {
        let event;
        while (null !== (event = body.read())) {
          if (Buffer.isBuffer(event)) {
            console.log(`[bedrock]`, event.toString('utf8'));
          }
        }
      });
      body.on('end', () => {
        resolove(response);
      });
    });
  }
  /**
   * https://docs.anthropic.com/claude/reference/messages-streaming
   * @returns
   */
  convertParams(opts) {
    return {
      prompt: '\n\nHuman: Hey Claude! How can I recursively list all files in a directory in Rust?\n\nAssistant:',
      temperature: 1,
      // top_k: 250,
      // top_p: 0.999,
      max_tokens_to_sample: 500,
      anthropic_version: 'bedrock-2023-05-31',
    };
  }
  // 将 Gemini 的结果转换为你的数据格式
  convertResult(result) {
    return {
      // 根据你的数据格式，从 Gemini 的结果中提取数据
      history: result.contents,
      // 其他数据...
    };
  }
};

// src/provider/aliyun/qwen.ts
import fetchSSE7 from 'node-fetch';
import { v4 as uuidv44 } from 'uuid';
import { HttpsProxyAgent as HttpsProxyAgent8 } from 'https-proxy-agent';
import { createParser as createParser7 } from 'eventsource-parser';
var AliyunQwenAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://dashscope.aliyuncs.com/api/v1' }, opts);
    super(options);
    this.provider = 'google';
  }
  models() {
    return ['qwen-turbo', 'qwen-plus', 'qwen-max'];
  }
  /**
   *
   * https://ai.google.dev/docs/gemini_api_overview?hl=zh-cn#curl_3
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const isMulti =
        opts.model !== 'qwen-turbo' &&
        opts.messages.some((item) => item.parts.some((part) => ['image'].includes(part.type)));
      const model = isMulti ? opts.model.replace('-', '-vl-') : opts.model;
      const url = `${this.baseURL}/services/aigc/${isMulti ? 'multimodal' : 'text'}-generation/generation`;
      const params = await this.convertParams(model, options);
      const res = await fetchSSE7(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-SSE': 'enable',
        },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent8(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.message || 'request error', res.status));
      }
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      const choicesList = [];
      const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const parser = createParser7((event) => {
        if (event.type === 'event') {
          const res2 = JSON.parse(event.data);
          if (res2?.output) {
            const choices = this.convertChoices(res2.output.choices);
            onProgress?.(choices);
            if (res2.usage) {
              const u = res2.usage;
              Object.assign(usage, {
                prompt_tokens: u.input_tokens,
                completion_tokens: u.output_tokens,
                total_tokens: u.total_tokens ? u.total_tokens : u.input_tokens + u.output_tokens,
              });
            }
            choicesList.push(...choices);
          }
          if (res2?.code) {
            reject(new chat.ChatError(res2?.message, 500));
          }
        }
      });
      body.on('readable', async () => {
        let chunk;
        while ((chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });
      body.on('end', () => {
        const choices = this.combineChoices(choicesList);
        resolove({ id: uuidv44(), model: opts.model, choices, usage });
      });
    });
  }
  /**
   * Aliyun Qwen API
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details
   * @returns
   */
  async convertParams(model, opts) {
    const params = {
      model: model || 'qwen-turbo',
      input: {
        messages: await this.corvertContents(opts),
      },
      parameters: {
        temperature: (opts.temperature || 0.85) * 2 - 0.1,
        top_p: opts.top_p || 0.8,
        // top_k: Math.round((opts.top_k || 0.025) * 100) || undefined,
        max_tokens: opts.max_tokens || 1500,
        incremental_output: true,
        enable_search: true,
      },
    };
    if (model.indexOf('vl') === -1) {
      Object.assign(params.parameters, {
        temperature: opts.temperature || 1,
        max_tokens: opts.max_tokens || 1500,
        enable_search: true,
        stop: opts.stop_sequences || void 0,
        result_format: 'message',
      });
    }
    return params;
  }
  async corvertContents(opts) {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts = [];
        await Promise.all(
          item.parts.map(async (part) => {
            if (part.type === 'text') {
              parts.push({ text: part.text });
            }
            if (part.type === 'file' && part.mimetype?.startsWith('image')) {
              parts.push({ image: part.url });
            }
          }),
        );
        let content = parts;
        if (!['qwen-vl-plus'].includes(opts.model)) {
          content = parts
            .map((item2) => {
              return 'text' in item2 ? item2.text : '';
            })
            .join('\n');
        }
        return { role: item.role, content: parts };
      }),
    );
  }
  convertChoices(candidates) {
    const choices = [];
    try {
      candidates.map(({ message, finish_reason }) => {
        const parts = [];
        if (typeof message.content === 'string') {
          parts.push({ type: 'text', text: message.content });
        }
        if (typeof message.content === 'object' && message.content instanceof Array) {
          message.content.map((part) => {
            if ('text' in part) {
              parts.push({ type: 'text', text: part.text });
            }
          });
        }
        choices.push({ index: 0, role: 'assistant', parts, finish_reason: 'stop' });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
};

// src/provider/aliyun/wanx.ts
import fetchSSE8 from 'node-fetch';
import { HttpsProxyAgent as HttpsProxyAgent9 } from 'https-proxy-agent';
var AliyunWanxAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://dashscope.aliyuncs.com/api/v1' }, opts);
    super(options);
    this.provider = 'google';
  }
  models() {
    return ['wanx-v1'];
  }
  /**
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details-9
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/services/aigc/text2image/image-synthesis`;
      const res = await fetchSSE8(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify(this.convertParams(opts)),
        agent: this.agent ? new HttpsProxyAgent9(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.message || 'request error', res.status));
      }
      try {
        const { output } = await res.json();
        if (output.task_status === 'FAILED') {
          reject(new chat.ChatError(output.message, res.status));
        }
        resolove(output);
      } catch (err) {
        reject(new chat.ChatError('request error', res.status));
      }
    });
  }
  async getTaskResult(task_id) {
    const url = `${this.baseURL}/tasks/${task_id}`;
    return new Promise(async (resolove, reject) => {
      const res = await fetchSSE8(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        agent: this.agent ? new HttpsProxyAgent9(this.agent) : void 0,
      });
      try {
        const { output } = await res.json();
        if (output.task_status === 'FAILED') {
          reject(new chat.ChatError(output.message, res.status));
        }
        resolove(output);
      } catch (err) {
        reject(new chat.ChatError('request error', res.status));
      }
    });
  }
  /**
   * https://help.aliyun.com/zh/dashscope/developer-reference/api-details-9
   * @returns
   */
  convertParams(opts) {
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
  convertResult(result) {
    return {
      // 根据你的数据格式，从 Gemini 的结果中提取数据
      history: result.contents,
      // 其他数据...
    };
  }
};

// src/provider/moonshot/kimi.ts
import fetchSSE9 from 'node-fetch';
import { v4 as uuidv45 } from 'uuid';
import { HttpsProxyAgent as HttpsProxyAgent10 } from 'https-proxy-agent';
import { createParser as createParser8 } from 'eventsource-parser';
var MoonshotKimiAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://api.moonshot.cn/v1' }, opts);
    super(options);
    this.provider = 'moonshot';
  }
  models() {
    return ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
  }
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params = await this.convertParams(options);
      const res = await fetchSSE9(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new HttpsProxyAgent10(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      if (params.stream === false) {
        const result = await res.json();
        const choices = this.convertChoices(result.choices);
        const usage = result?.usage;
        resolove({ id: uuidv45(), model: opts.model, choices, usage });
      } else {
        const body = res.body;
        body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
        const choicesList = [];
        const parser = createParser8((event) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                const res2 = JSON.parse(event.data);
                const choices = this.convertChoices(res2.choices);
                onProgress?.(choices);
                choicesList.push(...choices);
              } catch (e) {}
            }
          }
        });
        body.on('readable', async () => {
          let chunk;
          while ((chunk = body.read())) {
            parser.feed(chunk.toString());
          }
        });
        body.on('end', async () => {
          const choices = this.combineChoices(choicesList);
          const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          resolove({ id: uuidv45(), model: opts.model, choices, usage });
        });
      }
    });
  }
  /**
   * 转换为 Gemini 要求的请求参数
   * https://platform.openai.com/docs/api-reference/chat/create
   * @returns
   */
  async convertParams(opts) {
    const params = {
      model: opts.model || 'moonshot-v1-8k',
      messages: await this.corvertContents(opts),
      temperature: opts?.temperature || 0.9,
      top_p: opts?.top_p || 1,
      // frequency_penalty: 0,
      // presence_penalty: 0,
      max_tokens: opts?.max_tokens || 1e3,
      n: opts.n || 1,
      stop: opts?.stop_sequences || void 0,
      stream: true,
    };
    if (opts.tools && opts.tools.length > 0) {
      Object.assign(params, { tools: opts.tools, stream: false });
    }
    return params;
  }
  async corvertContents(opts) {
    return Promise.all(
      opts.messages.map(async (item) => {
        const parts = [];
        await Promise.all(
          item.parts.map(async (part) => {
            if (part.type === 'text') {
              parts.push(part.text);
            }
          }),
        );
        return { role: item.role, content: parts.join('\n') };
      }),
    );
  }
  convertChoices(candidates) {
    const choices = [];
    try {
      candidates.map(({ index, delta, message, finish_reason }) => {
        const parts = [];
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
};

// src/provider/qcloud/hunyuan.ts
import { v4 as uuidv46 } from 'uuid';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
var QcloudHunyuanAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://hunyuan.tencentcloudapi.com' }, opts);
    super(options);
    this.provider = 'tencent';
    this.client = new tencentcloud.hunyuan.v20230901.Client({
      credential: { secretId: this.apiKey, secretKey: this.apiSecret },
      profile: {
        signMethod: 'TC3-HMAC-SHA256',
        httpProfile: { reqMethod: 'POST', reqTimeout: 30, endpoint: 'hunyuan.tencentcloudapi.com' },
      },
    });
  }
  models() {
    return ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'];
  }
  /**
   * tencent hunyuan
   * https://cloud.tencent.com/document/api/1729/101836
   * @param opts
   * @returns
   */
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      if (!this.models().includes(opts.model)) {
        reject(new Error(`model ${opts.model} is not supported`));
      }
      const params = await this.convertParams(options);
      const response = await this.client.ChatCompletions(params);
      let id = uuidv46();
      const choicesList = [];
      const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      for await (let message of response) {
        const res = JSON.parse(message.data);
        id = res.Id;
        const choices2 = this.convertChoices(res.Choices);
        if (res.Usage) {
          Object.assign(usage, {
            prompt_tokens: res.Usage.PromptTokens,
            completion_tokens: res.Usage.CompletionTokens,
            total_tokens: res.Usage.TotalTokens,
          });
        }
        onProgress?.(choices2);
        choicesList.push(...choices2);
      }
      const choices = this.combineChoices(choicesList);
      resolove({ id, model: opts.model, choices, usage });
    });
  }
  /**
   * 转换请求参数
   * @returns
   */
  async convertParams(opts) {
    return {
      Model: opts.model,
      TopP: opts.top_p || 1,
      Temperature: opts.temperature || 1,
      Messages: await this.corvertContents(opts),
      Stream: true,
    };
  }
  async corvertContents(opts) {
    return Promise.all(
      opts.messages.map(async (item) => {
        const contents = [];
        await Promise.all(
          item.parts.map(async (part) => {
            if (part.type === 'text') {
              contents.push(part.text);
            }
          }),
        );
        return { Role: item.role, Content: contents.join('/n') };
      }),
    );
  }
  convertChoices(candidates) {
    const choices = [];
    try {
      candidates.map(({ Delta, FinishReason }, index) => {
        const parts = [];
        parts.push({ type: 'text', text: Delta.Content });
        choices.push({ index, role: 'assistant', parts, finish_reason: 'stop' });
      });
    } catch (err) {
      console.warn(err);
    }
    return choices;
  }
};

// src/api/chat.ts
var ChatAPI = class {
  constructor(provider, opts) {
    this.provider = null;
    switch (provider) {
      case 'google-vertex' /* GOOGLE_VERTEX */:
        this.provider = new GoogleVertexAPI(opts);
        break;
      case 'google-gemini' /* GOOGLE_GEMINI */:
        this.provider = new GoogleGeminiAPI(opts);
        break;
      case 'google-claude' /* GOOGLE_CLAUDE */:
        this.provider = new GoogleClaudeAPI(opts);
        break;
      case 'openai-completion' /* OPENAI_COMPLETIONS */:
        this.provider = new OpenAICompletionsAPI(opts);
        break;
      case 'openai-assistant' /* OPENAI_ASSISTANTS */:
        this.provider = new OpenAIAssistantsAPI(opts);
        break;
      case 'aliyun-qwen' /* ALIYUN_QWEN */:
        this.provider = new AliyunQwenAPI(opts);
        break;
      case 'aliyun-wanx' /* ALIYUN_WANX */:
        this.provider = new AliyunWanxAPI(opts);
        break;
      case 'anthropic-claude' /* ANTHROPIC_CLAUDE */:
        this.provider = new AnthropicClaudeAPI(opts);
        break;
      case 'anthropic-bedrock' /* ANTHROPIC_BEDROCK */:
        this.provider = new AnthropicBedrockAPI(opts);
        break;
      case 'qcloud-hunyuan' /* QCLOUD_HUNYUAN */:
        this.provider = new QcloudHunyuanAPI(opts);
        break;
      case 'moonshot-kimi' /* MOONSHOT_KIMI */:
        this.provider = new MoonshotKimiAPI(opts);
        break;
      default:
        throw new Error(`Unsupported supplier: ${provider}`);
    }
  }
  async sendMessage(opts) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.sendMessage(opts);
  }
};

// src/api/image.ts
var ImageAPI = class {
  constructor(provider, opts) {
    this.provider = null;
    switch (provider) {
      case 'aliyun-wanx' /* ALIYUN_WANX */:
        this.provider = new AliyunWanxAPI(opts);
        break;
      default:
        throw new Error(`Unsupported supplier: ${provider}`);
    }
  }
  async sendMessage(opts) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.sendMessage(opts);
  }
  async getTaskResult(task_id) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.getTaskResult(task_id);
  }
};
export { ChatAPI, ImageAPI, Provider, chat };
//# sourceMappingURL=index.js.map
