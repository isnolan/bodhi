import { describe, expect, it } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.AWS_BEDROCK_ACCESS || !process.env.AWS_BEDROCK_SECRET) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.ANTHROPIC_BEDROCK, {
    apiKey: process.env?.AWS_BEDROCK_ACCESS as string,
    apiSecret: process.env?.AWS_BEDROCK_SECRET as string,
    agent: process.env.HTTP_PROXY as string,
  });

  // text: streaming
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'anthropic.claude-instant-v1',
      messages: [
        { role: 'user', parts: [{ text: 'Hello, 我们家有两只狗' }] },
        { role: 'model', parts: [{ text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      // onProgress: (choices) => {
      //   console.log(`[bedrock]`, JSON.stringify(choices));
      //   expect(choices).toBeInstanceOf(Object);
      // },
    });
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
