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
      model: 'claude-3-haiku-20240307',
      messages: [
        { role: 'system', parts: [{ type: 'text', text: '你是一位资深的儿童作家，擅长写作高情商儿童故事' }] },
        { role: 'user', parts: [{ type: 'text', text: '白雪公主与七个小矮人' }] },
        // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
      ],
      onProgress: (choices) => {
        console.log(`[anthropic]claude`, 'progress', JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[anthropic]claude`, 'result', JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // vision: image part, from inline data
  // it('text: streaming', async () => {
  //   const res = await api.sendMessage({
  //     // model: 'claude-instant-1.2',
  //     model: 'claude-3-sonnet@20240229',
  //     messages: [
  //       {
  //         role: 'user',
  //         parts: [
  //           {
  //             type: 'image',
  //             url: 'https://miro.medium.com/v2/resize:fit:720/format:jpeg/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
  //           },
  //           { type: 'text', text: 'Describe this image' },
  //         ],
  //       },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[anthropic]claude:vision`, 'progress', JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[anthropic]claude:vision`, 'result', JSON.stringify(res));
  //   expect(res).toBeInstanceOf(Object);
  // }, 30000);
});
