import * as dotenv from 'dotenv';
import * as path from 'path';
import { OpenAICompletionsAPI } from '../src/provider';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.PROXY_URL || !process.env.GEMINI) {
      console.log('Skipping test due to missing environment variables');
      pending();
    }
  });

  const api = new OpenAICompletionsAPI({
    apiKey: process.env?.OPENAI as string, // 使用你的 API 密钥
    agent: process.env.PROXY_URL as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: '请写一篇关于我家小狗子的故事，要求字数不少于200字!' },
      ],
      onProgress: (choices) => {
        console.log(`[openai]`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
