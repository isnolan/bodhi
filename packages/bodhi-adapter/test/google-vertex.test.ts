import fs from 'node:fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const credential = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../.credentials/google-cloud.json'), 'utf8'),
);

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !credential.client_email) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.GOOGLE_VERTEX, {
    baseURL: 'https://us-central1-aiplatform.googleapis.com/v1/projects/bodhi-415003/locations/us-central1',
    apiKey: credential.client_email,
    apiSecret: credential.private_key,
    agent: process.env.HTTP_PROXY as string,
  });

  // 发送聊天消息
  // it('text: streaming', async () => {
  //   const res = await api.sendMessage({
  //     model: 'gemini-pro',
  //     messages: [
  //       {
  //         role: 'system',
  //         parts: [
  //           {
  //             type: 'text',
  //             text: "You are a professional children's literature writer, good at writing children's stories.",
  //           },
  //         ],
  //       },
  //       // { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
  //       // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
  //       { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[vertex]progress:`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });

  //   console.log(`[vertex]result:`, JSON.stringify(res));
  //   expect(res).toBeInstanceOf(Object);
  // }, 30000);

  it('file: document', async () => {
    const res = await api.sendMessage({
      model: 'gemini-1.0-pro', // gemini-1.5-pro-preview-0409
      messages: [
        {
          role: 'user',
          parts: [
            {
              type: 'file',
              mime_type: 'application/pdf',
              // url: 'gs://cloud-samples-data/generative-ai/pdf/2403.05530.pdf',
              url: 'gs://bodhi-storage/uploads/202405/0db16ca633824283d07cf3774f886cef/0.pdf',
              // url: 'https://s.chatonce.cn/bodhi/uploads/202405/0db16ca633824283d07cf3774f886cef/0.pdf',
            },
            {
              type: 'text',
              text: '这个文档都讲了什么呢？',
            },
          ],
        },
        // { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
        // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
        // { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      onProgress: (choices) => {
        console.log(`[vertex]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });

    console.log(`[vertex]result:`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 60000);

  // vision: image part, from inline data
  it('file: image', async () => {
    const res = await api.sendMessage({
      model: 'gemini-1.0-pro',
      messages: [
        {
          role: 'user',
          parts: [
            { type: 'text', text: 'Describe this image' },
            {
              type: 'file',
              mime_type: 'image/jpeg',
              url: 'https://miro.medium.com/v2/resize:fit:720/format:jpeg/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
            },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[vertex]`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });

    console.log(`[vertex]result:`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // vision: video part, from Google Cloud Storage
  it('file: video', async () => {
    const result = await api.sendMessage({
      model: 'gemini-1.0-pro',
      messages: [
        {
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Answer the following questions using the video only. What is the profession of the main person? What are the main features of the phone highlighted?Which city was this recorded in?Provide the answer JSON.',
            },
            {
              type: 'file',
              mime_type: 'video/mp4',
              url: 'gs://github-repo/img/gemini/multimodality_usecases_overview/pixel8.mp4',
              id: 'image_1',
            },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[vertex]`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    expect(result).toBeInstanceOf(Object);
  }, 30000);

  // function call
  // it('function call', async () => {
  //   const result = await api.sendMessage({
  //     model: 'gemini-pro',
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
