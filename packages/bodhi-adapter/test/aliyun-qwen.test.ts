import { describe, expect, test } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.PROXY_URL || !process.env.ALIYUN) {
      console.log('Skipping test due to missing environment variables');
      pending();
    }
  });

  const api = new ChatAPI(Provider.ALIYUN_QWEN, {
    apiKey: process.env?.ALIYUN as string,
    agent: process.env.PROXY_URL as string,
  });

  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'qwen-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: '你好，哪个公园距离我最近？' },
      ],
      onProgress: (choices) => {
        console.log(`[aliyun]`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    expect(res).toBeInstanceOf(Object);
  }, 30000);

  // image, from url
  it('image: from url', async () => {
    const res = await api.sendMessage({
      model: 'qwen-vl-plus',
      messages: [
        { role: 'system', content: [{ text: 'You are a helpful assistant.' }] },
        {
          role: 'user',
          content: [
            { image: 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg' },
            { text: '这个图片是哪里？' },
          ],
        },
      ],
      onProgress: (choices) => {
        console.log(`[aliyun]`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
