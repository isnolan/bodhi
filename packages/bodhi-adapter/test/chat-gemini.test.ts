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

  // (async () => {
  const api = new ChatAPI(Provider.GOOGLE_GEMINI, {
    apiKey: process.env?.GEMINI as string,
    agent: process.env.PROXY_URL as string,
  });

  // 发送聊天消息
  it('sendMessage', async () => {
    const result = await api.sendMessage({
      model: 'gemini-pro',
      messages: [
        { role: 'user', parts: [{ text: 'Hello, 我们家有两只狗' }] },
        { role: 'model', parts: [{ text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      onProgress: (choices) => {
        // console.log(`[gemini]choices`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });

    // console.log(`[gemini]`, result);
    // })();

    expect(result).toBeInstanceOf(Object);
  }, 30000);
});
