import { describe, expect, test } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.PROXY_URL || !process.env.GEMINI) {
      console.log('Skipping test due to missing environment variables');
      pending();
    }
  });

  const api = new ChatAPI(Provider.GOOGLE_GEMINI, {
    apiKey: process.env?.GEMINI as string,
    agent: process.env.PROXY_URL as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'gemini-pro',
      messages: [
        { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
        { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      onProgress: (choices) => {
        console.log(`[gemini]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[gemini]result:`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // vision: image part, from inline data
  it('vision:image from inline data', async () => {
    const res = await api.sendMessage({
      model: 'gemini-pro-vision',
      messages: [
        {
          role: 'user',
          parts: [
            { type: 'text', text: 'Describe this image' },
            {
              type: 'image',
              url: 'https://miro.medium.com/v2/resize:fit:720/format:webp/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
            },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[gemini]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[gemini]result:`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // function call
  it('function call', async () => {
    const result = await api.sendMessage({
      model: 'gemini-pro',
      messages: [
        {
          role: 'user',
          parts: [{ type: 'text', text: 'Which theaters in Mountain View show Barbie movie?' }],
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'find_theaters',
            description:
              'find theaters based on location and optionally movie title which are is currently playing in theaters',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA or a zip code e.g. 95616',
                },
                movie: { type: 'string', description: 'Any movie title' },
              },
              required: ['location'],
            },
          },
        },
      ],
      onProgress: (choices) => {
        console.log(`[gemini]`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    expect(result).toBeInstanceOf(Object);
  }, 30000);
});
