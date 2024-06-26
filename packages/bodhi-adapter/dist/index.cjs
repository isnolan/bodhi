'use strict';
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
    mod,
  )
);
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ChatAPI: () => ChatAPI,
  ImageAPI: () => ImageAPI,
  Provider: () => Provider,
  chat: () => chat,
});
module.exports = __toCommonJS(src_exports);

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
  Provider2['DEEPSEEK'] = 'deepseek';
  Provider2['GROQ'] = 'groq';
  return Provider2;
})(Provider || {});

// src/provider/openai/completions.ts
var import_node_fetch2 = __toESM(require('node-fetch'), 1);
var import_uuid = require('uuid');
var import_https_proxy_agent2 = require('https-proxy-agent');
var import_eventsource_parser = require('eventsource-parser');

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
var import_tiktoken = require('tiktoken');
var import_node_fetch = __toESM(require('node-fetch'), 1);
var import_https_proxy_agent = require('https-proxy-agent');
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
    const response = await (0, import_node_fetch.default)(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      agent: this.agent ? new import_https_proxy_agent.HttpsProxyAgent(this.agent) : void 0,
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
  caclulateUsage(messages, choices) {
    const parts = messages.flatMap((item) => item.parts);
    const prompt_tokens = parts
      .filter((p) => p.type === 'text' || (p.type === 'file' && p.extract))
      .reduce((acc, item) => {
        return acc + this.getTokenCount(item?.text || item?.extract);
      }, 0);
    const completion_tokens = choices.reduce((acc, item) => {
      return acc + this.getTokenCount(item.parts.map((part) => part.text).join(''));
    }, 0);
    return { prompt_tokens, completion_tokens, total_tokens: prompt_tokens + completion_tokens };
  }
  getTokenCount(text) {
    return (0, import_tiktoken.get_encoding)('cl100k_base').encode(text).length;
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
      const res = await (0, import_node_fetch2.default)(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent2.HttpsProxyAgent(this.agent) : void 0,
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
        resolove({ id: (0, import_uuid.v4)(), model: opts.model, choices, usage });
      } else {
        const body = res.body;
        body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
        const choicesList = [];
        const parser = (0, import_eventsource_parser.createParser)((event) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                const result = JSON.parse(event.data);
                const choices = this.convertChoices(result.choices);
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
          const usage = this.caclulateUsage(opts.messages, choices);
          resolove({ id: (0, import_uuid.v4)(), model: opts.model, choices, usage });
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
            if (part.type === 'file' && part?.extract) {
              parts.push({ type: 'text', text: part.extract });
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
var import_node_fetch4 = __toESM(require('node-fetch'), 1);
var import_uuid3 = require('uuid');
var import_google_auth_library = require('google-auth-library');
var import_https_proxy_agent4 = require('https-proxy-agent');
var import_eventsource_parser3 = require('eventsource-parser');

// src/provider/google/gemini.ts
var import_node_fetch3 = __toESM(require('node-fetch'), 1);
var import_uuid2 = require('uuid');
var import_https_proxy_agent3 = require('https-proxy-agent');
var import_eventsource_parser2 = require('eventsource-parser');
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
      const model = this.detechModel(opts);
      const url = `${this.baseURL}/models/${model}:streamGenerateContent?alt=sse`;
      const res = await (0, import_node_fetch3.default)(url, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent3.HttpsProxyAgent(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
      }
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      const choicesList = [];
      const parser = (0, import_eventsource_parser2.createParser)((event) => {
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
        resolove({ id: (0, import_uuid2.v4)(), model: opts.model, choices, usage });
      });
    });
  }
  detechModel(opts) {
    const hasMedia = opts.messages.some((item) =>
      item.parts.some(
        (part) =>
          part.type === 'file' &&
          (part.mimetype.startsWith('image') || part.mimetype.startsWith('video') || part.mimetype.startsWith('audio')),
      ),
    );
    return hasMedia && opts.model === 'gemini-1.0-pro' ? 'gemini-1.0-pro-vision' : opts.model;
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
                if (part?.extract) {
                  parts.push({ text: part.extract });
                } else {
                  const { mimetype: mimeType, url } = part;
                  if (url.startsWith('gs://')) {
                    parts.push({ fileData: { mimeType, fileUri: url } });
                  } else {
                    try {
                      parts.push({ inlineData: await this.fetchFile(url) });
                    } catch (err) {}
                  }
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
      console.log(`->candidates1`, JSON.stringify(candidates, null, 2));
      console.warn(err);
      console.log(`->candidates2`);
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
    const auth = new import_google_auth_library.GoogleAuth({
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
      const model = this.detechModel(opts);
      const url = `${this.baseURL}/publishers/google/models/${model}:streamGenerateContent?alt=sse`;
      const params = await this.convertParams(options);
      const res = await (0, import_node_fetch4.default)(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent4.HttpsProxyAgent(this.agent) : void 0,
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
      const parser = (0, import_eventsource_parser3.createParser)((event) => {
        if (event.type === 'event') {
          const res2 = JSON.parse(event.data);
          if (!res2.candidates) {
            console.log(`[vertex]debug`, res2);
          }
          const choices = this.convertChoices(res2.candidates || []);
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
        resolove({ id: (0, import_uuid3.v4)(), model: opts.model, choices, usage });
      });
    });
  }
};

// src/provider/google/claude.ts
var import_node_fetch5 = __toESM(require('node-fetch'), 1);
var import_google_auth_library2 = require('google-auth-library');
var import_https_proxy_agent5 = require('https-proxy-agent');
var import_eventsource_parser4 = require('eventsource-parser');
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
    const auth = new import_google_auth_library2.GoogleAuth({
      credentials: { client_email: this.apiKey, private_key: this.apiSecret },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return await auth.getAccessToken();
  }
  models() {
    return ['claude-3-sonnet@20240229', 'claude-3-haiku@20240307', 'gemini-1.5-flash-preview-0514'];
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
      const res = await (0, import_node_fetch5.default)(url, {
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent5.HttpsProxyAgent(this.agent) : void 0,
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
      const parser = (0, import_eventsource_parser4.createParser)((event) => {
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
              if (part.type === 'text') {
                parts.push({ type: 'text', text: part.text });
              }
              if (part.type === 'file' && part?.extract) {
                parts.push({ type: 'text', text: part.extract });
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
var import_node_fetch6 = __toESM(require('node-fetch'), 1);
var import_https_proxy_agent6 = require('https-proxy-agent');
var import_eventsource_parser5 = require('eventsource-parser');
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
      const res = await (0, import_node_fetch6.default)(url, {
        headers: {
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent6.HttpsProxyAgent(this.agent) : void 0,
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
      const parser = (0, import_eventsource_parser5.createParser)((event) => {
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
              if (part.type === 'file' && part?.extract) {
                parts.push({ type: 'text', text: part.extract });
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
var import_node_fetch7 = __toESM(require('node-fetch'), 1);
var import_https_proxy_agent7 = require('https-proxy-agent');
var import_eventsource_parser6 = require('eventsource-parser');

// src/provider/anthropic/auth.ts
var import_signature_v4 = require('@smithy/signature-v4');
var import_protocol_http = require('@aws-sdk/protocol-http');
var import_sha256_js = require('@aws-crypto/sha256-js');
async function requestWithAuth(options, request) {
  const { accessKeyId, secretAccessKey, region, service } = options;
  const credentials = { accessKeyId, secretAccessKey };
  const signed = await new import_signature_v4.SignatureV4({
    region,
    service,
    sha256: import_sha256_js.Sha256,
    credentials,
  }).sign(new import_protocol_http.HttpRequest(request));
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
      const res = await (0, import_node_fetch7.default)(url, {
        headers: req.headers,
        body: req.body,
        agent: this.agent ? new import_https_proxy_agent7.HttpsProxyAgent(this.agent) : void 0,
        method: req.method,
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.message || 'request error', res.status));
      }
      let response;
      const body = res.body;
      body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
      const parser = (0, import_eventsource_parser6.createParser)((event) => {
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
var import_node_fetch8 = __toESM(require('node-fetch'), 1);
var import_uuid4 = require('uuid');
var import_https_proxy_agent8 = require('https-proxy-agent');
var import_eventsource_parser7 = require('eventsource-parser');
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
      const res = await (0, import_node_fetch8.default)(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-SSE': 'enable',
        },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent8.HttpsProxyAgent(this.agent) : void 0,
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
      const parser = (0, import_eventsource_parser7.createParser)((event) => {
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
        resolove({ id: (0, import_uuid4.v4)(), model: opts.model, choices, usage });
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
        top_p: opts.top_p < 0 || opts.top_p >= 1 ? 0.8 : opts.top_p,
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
            if (part.type === 'file' && part?.extract) {
              parts.push({ text: part.extract });
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
var import_node_fetch9 = __toESM(require('node-fetch'), 1);
var import_https_proxy_agent9 = require('https-proxy-agent');
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
      const res = await (0, import_node_fetch9.default)(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify(this.convertParams(opts)),
        agent: this.agent ? new import_https_proxy_agent9.HttpsProxyAgent(this.agent) : void 0,
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
      const res = await (0, import_node_fetch9.default)(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        agent: this.agent ? new import_https_proxy_agent9.HttpsProxyAgent(this.agent) : void 0,
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
var import_node_fetch10 = __toESM(require('node-fetch'), 1);
var import_uuid5 = require('uuid');
var import_https_proxy_agent10 = require('https-proxy-agent');
var import_eventsource_parser8 = require('eventsource-parser');
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
      const res = await (0, import_node_fetch10.default)(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent10.HttpsProxyAgent(this.agent) : void 0,
        method: 'POST',
      });
      if (!res.ok) {
        const reason = await res.json();
        reject(new chat.ChatError(reason.error?.message || 'request error', res.status));
        return;
      }
      let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      if (params.stream === false) {
        const result = await res.json();
        const choices = this.convertChoices(result.choices);
        resolove({ id: (0, import_uuid5.v4)(), model: opts.model, choices, usage: result.usage });
      } else {
        const body = res.body;
        body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
        const choicesList = [];
        const parser = (0, import_eventsource_parser8.createParser)((event) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                const result = JSON.parse(event.data);
                const choices = this.convertChoices(result.choices);
                usage = this.convertChoicesUsage(result.choices, usage);
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
          resolove({ id: (0, import_uuid5.v4)(), model: opts.model, choices, usage });
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
      stream: opts?.stream != void 0 ? opts.stream : true,
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
            if (part.type === 'file' && part?.extract) {
              parts.push(part.extract);
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
  convertChoicesUsage(candidates, initial) {
    candidates.map(({ usage }) => {
      if (usage) {
        initial.prompt_tokens += usage.prompt_tokens;
        initial.completion_tokens += usage.completion_tokens;
        initial.total_tokens += usage.total_tokens;
      }
    });
    return initial;
  }
};

// src/provider/qcloud/hunyuan.ts
var import_uuid6 = require('uuid');
var tencentcloud = __toESM(require('tencentcloud-sdk-nodejs'), 1);
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
      let id = (0, import_uuid6.v4)();
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
        const parts = [];
        await Promise.all(
          item.parts.map(async (part) => {
            if (part.type === 'text') {
              parts.push(part.text);
            }
            if (part.type === 'file' && part?.extract) {
              parts.push(part.extract);
            }
          }),
        );
        return { Role: item.role, Content: parts.join('/n') };
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

// src/provider/deepseek/deepseek.ts
var import_node_fetch11 = __toESM(require('node-fetch'), 1);
var import_uuid7 = require('uuid');
var import_https_proxy_agent11 = require('https-proxy-agent');
var import_eventsource_parser9 = require('eventsource-parser');
var DeepSeekAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://api.deepseek.com' }, opts);
    super(options);
    this.provider = 'moonshot';
  }
  models() {
    return ['deepseek-chat'];
  }
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params = await this.convertParams(options);
      const res = await (0, import_node_fetch11.default)(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent11.HttpsProxyAgent(this.agent) : void 0,
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
        resolove({ id: (0, import_uuid7.v4)(), model: opts.model, choices, usage });
      } else {
        const body = res.body;
        body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
        let result;
        const choicesList = [];
        const parser = (0, import_eventsource_parser9.createParser)((event) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                result = JSON.parse(event.data);
                const choices = this.convertChoices(result.choices);
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
          resolove({ id: (0, import_uuid7.v4)(), model: opts.model, choices, usage: result.usage });
        });
      }
    });
  }
  /**
   * https://platform.deepseek.com/api-docs/zh-cn/api/create-chat-completion/index.html
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
      // n: opts.n || 1,
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
            if (part.type === 'file' && part?.extract) {
              parts.push(part.extract);
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

// src/provider/groq/completions.ts
var import_node_fetch12 = __toESM(require('node-fetch'), 1);
var import_uuid8 = require('uuid');
var import_https_proxy_agent12 = require('https-proxy-agent');
var import_eventsource_parser10 = require('eventsource-parser');
var GroqCompletionsAPI = class extends ChatBaseAPI {
  constructor(opts) {
    const options = Object.assign({ baseURL: 'https://api.groq.com/openai/v1' }, opts);
    super(options);
    this.provider = 'groq';
  }
  models() {
    return ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'];
  }
  async sendMessage(opts) {
    const { onProgress = () => {}, ...options } = opts;
    return new Promise(async (resolove, reject) => {
      const url = `${this.baseURL}/chat/completions`;
      const params = await this.convertParams(options);
      const res = await (0, import_node_fetch12.default)(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
        agent: this.agent ? new import_https_proxy_agent12.HttpsProxyAgent(this.agent) : void 0,
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
        resolove({ id: (0, import_uuid8.v4)(), model: opts.model, choices, usage });
      } else {
        const body = res.body;
        body.on('error', (err) => reject(new chat.ChatError(err.message, 500)));
        let result;
        const choicesList = [];
        const parser = (0, import_eventsource_parser10.createParser)((event) => {
          if (event.type === 'event') {
            if (event.data !== '[DONE]') {
              try {
                result = JSON.parse(event.data);
                const choices = this.convertChoices(result.choices);
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
          const { prompt_tokens, completion_tokens, total_tokens } = result?.x_groq?.usage;
          const usage = { prompt_tokens, completion_tokens, total_tokens };
          resolove({ id: (0, import_uuid8.v4)(), model: opts.model, choices, usage });
        });
      }
    });
  }
  /**
   * 转换为 Gemini 要求的请求参数
   * https://platform.groq.com/docs/api-reference/chat/create
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
            if (part.type === 'file' && part?.extract) {
              parts.push({ type: 'text', text: part.extract });
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
      case 'deepseek' /* DEEPSEEK */:
        this.provider = new DeepSeekAPI(opts);
        break;
      case 'groq' /* GROQ */:
        this.provider = new GroqCompletionsAPI(opts);
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
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    ChatAPI,
    ImageAPI,
    Provider,
    chat,
  });
//# sourceMappingURL=index.cjs.map
