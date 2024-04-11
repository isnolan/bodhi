import * as path from 'path';
import * as dotenv from 'dotenv';
import { Provider } from '@/types';
import { ChatAPI } from '@/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.MOONSHOT_API_KEY) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.MOONSHOT_KIMI, {
    apiKey: process.env?.MOONSHOT_API_KEY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', parts: [{ type: 'text', text: '你是一位资深的儿童作家，擅长写作高情商儿童故事' }] },
        { role: 'user', parts: [{ type: 'text', text: '白雪公主与七个小矮人' }] },
      ],
      onProgress: (choices) => {
        console.log(`[kimi]process`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[kimi]process`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 50000);

  // vision: image part, from inline data
  // it('vision:image from inline data', async () => {
  //   const res = await api.sendMessage({
  //     model: 'gpt-4-vision-preview',
  //     max_tokens: 1000,
  //     messages: [
  //       {
  //         role: 'user',
  //         parts: [
  //           { type: 'text', text: 'Describe this image' },
  //           {
  //             type: 'image',
  //             url: 'https://miro.medium.com/v2/resize:fit:720/format:jpeg/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
  //           },
  //         ],
  //       },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[openai]progress:`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[openai]result:`, JSON.stringify(res, null, 2));
  //   expect(res).toBeInstanceOf(Object);
  // }, 20000);

  // function call
  // it('function call', async () => {
  //   const result = await api.sendMessage({
  //     model: 'gpt-3.5-turbo-1106',
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
  //       console.log(`[gemini]`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[gemini]result:`, JSON.stringify(result));
  //   expect(result).toBeInstanceOf(Object);
  // }, 30000);
});
