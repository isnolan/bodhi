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
  // it('text: streaming', async () => {
  //   const res = await api.sendMessage({
  //     model: 'claude-3-haiku-20240307',
  //     messages: [
  //       { role: 'system', parts: [{ type: 'text', text: '你是一位资深的儿童作家，擅长写作高情商儿童故事' }] },
  //       { role: 'user', parts: [{ type: 'text', text: '白雪公主与七个小矮人' }] },
  //       // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[anthropic]claude`, 'progress', JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[anthropic]claude`, 'result', JSON.stringify(res));
  //   expect(res).toBeInstanceOf(Object);
  // }, 30000);

  // // vision: image part, from inline data
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      // model: 'claude-instant-1.2',
      model: 'claude-3-haiku-20240307',
      messages: [
        {
          role: 'user',
          parts: [
            {
              id: 'image_1',
              type: 'file',
              mimetype: 'image/jpeg',
              url: 'https://miro.medium.com/v2/resize:fit:720/format:jpeg/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
            },
            { type: 'text', text: 'Describe this image' },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[anthropic]claude:vision`, 'progress', JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[anthropic]claude:vision`, 'result', JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // function call
  // it('function call', async () => {
  //   const result = await api.sendMessage({
  //     model: 'claude-3-haiku-20240307',
  //     messages: [
  //       {
  //         role: 'user',
  //         parts: [{ type: 'text', text: 'Which theaters in Mountain View show Barbie movie?' }],
  //       },
  //     ],
  //     tools: [
  //       {
  //         type: 'function',
  //         function: {
  //           name: 'find_theaters',
  //           description:
  //             'find theaters based on location and optionally movie title which are is currently playing in theaters',
  //           parameters: {
  //             type: 'object',
  //             properties: {
  //               location: {
  //                 type: 'string',
  //                 description: 'The city and state, e.g. San Francisco, CA or a zip code e.g. 95616',
  //               },
  //               movie: { type: 'string', description: 'Any movie title' },
  //             },
  //             required: ['location'],
  //           },
  //         },
  //       },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[anthropic]`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[anthropic]result:`, JSON.stringify(result));
  //   expect(result).toBeInstanceOf(Object);
  // }, 10000);
});
