import fetchSSE from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createParser, type ParseEvent, type ReconnectInterval } from 'eventsource-parser';

import * as types from '@/types';
import { ChatBaseAPI } from '../base';

export class OpenAIAssistantsAPI extends ChatBaseAPI {
  protected provider: string = 'openai';

  constructor(opts: types.chat.ChatOptions) {
    const options = Object.assign({ baseURL: 'https://api.openai.com/v1' }, opts);
    super(options);
  }
}
