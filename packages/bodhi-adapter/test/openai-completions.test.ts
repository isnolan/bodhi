import * as path from 'path';
import * as dotenv from 'dotenv';
import { OpenAICompletionsAPI } from '../src/provider';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.OPENAI_API_KEY) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new OpenAICompletionsAPI({
    apiKey: process.env?.OPENAI_API_KEY as string, // 使用你的 API 密钥
    agent: process.env.HTTP_PROXY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'gpt-3.5-turbo',
      messages: [
        // { role: 'system', parts: [{ type: 'text', text: '你是一个儿童故事作家' }] },
        { role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      ],
      onProgress: (choices) => {
        console.log(`[openai]process`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[openai]result`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 50000);

  // vision: image part, from inline data
  it('vision:image from inline data', async () => {
    const res = await api.sendMessage({
      model: 'gpt-4-turbo',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          parts: [
            { type: 'text', text: 'Describe this image' },
            {
              type: 'file',
              mimetype: 'image/jpeg',
              url: 'https://miro.medium.com/v2/resize:fit:720/format:jpeg/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
              id: 'image_1',
            },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[openai]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[openai]result:`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 20000);

  // function call
  // it('function call', async () => {
  //   const result = await api.sendMessage({
  //     model: 'gpt-3.5-turbo',
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
  //       console.log(`[openai]`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[openai]result:`, JSON.stringify(result));
  //   expect(result).toBeInstanceOf(Object);
  // }, 30000);
});
