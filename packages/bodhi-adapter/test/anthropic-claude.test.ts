import { describe, expect, it } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.ANTHROPIC_CLAUDE_KEY) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.ANTHROPIC_CLAUDE, {
    apiKey: process.env?.ANTHROPIC_CLAUDE_KEY as string,
    agent: process.env.HTTP_PROXY as string,
  });

  // text: streaming
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'claude-instant-1.2',
      messages: [
        // { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
        // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
      ],
      onProgress: (choices) => {
        console.log(`[anthropic]claude`, 'progress', JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[anthropic]claude`, 'result', JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
