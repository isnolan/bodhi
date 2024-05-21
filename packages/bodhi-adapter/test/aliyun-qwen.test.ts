import { describe, expect, test } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.ALIYUN) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.ALIYUN_QWEN, {
    apiKey: process.env?.ALIYUN as string,
    agent: process.env.HTTP_PROXY as string,
  });

  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'qwen-turbo', // qwen-turbo
      messages: [
        // { role: 'system', content: 'You are a helpful assistant.' },
        // { role: 'user', content: '你好，哪个公园距离我最近？' },
        { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
        { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
        // { role: 'user', parts: [{ type: 'text', text: '今天最新AI科技新闻是什么？' }] },
      ],
      top_k: 1.0,
      // top_p
      onProgress: (choices) => {
        console.log(`[qwen]streaming`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[qwen]`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // image, from url
  it('image: from url', async () => {
    const res = await api.sendMessage({
      model: 'qwen-plus', //
      messages: [
        {
          role: 'system',
          parts: [{ type: 'text', text: 'You are a helpful assistant.' }],
        },
        {
          role: 'user',
          parts: [
            {
              id: '1',
              type: 'file',
              mimetype: 'image/jpeg',
              url: 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg',
            },
            { type: 'text', text: 'Describe this image' },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[qwen]muliti`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });

    console.log(`[qwen]muliti`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  it('text: max', async () => {
    const res = await api.sendMessage({
      model: 'qwen-max', // qwen-turbo
      messages: [{ role: 'user', parts: [{ type: 'text', text: '今天最新AI科技新闻是什么？' }] }],
      top_k: 1.0,
      // top_p
      onProgress: (choices) => {
        console.log(`[qwen]streaming`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[qwen]`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
