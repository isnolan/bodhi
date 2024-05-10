import * as path from 'path';
import * as dotenv from 'dotenv';
import { GroqCompletionsAPI } from '@/provider/groq';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.GROQ_API_KEY) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new GroqCompletionsAPI({
    apiKey: process.env?.GROQ_API_KEY as string, // 使用你的 API 密钥
    agent: process.env.HTTP_PROXY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', parts: [{ type: 'text', text: '你是一个儿童故事作家' }] },
        { role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      ],
      onProgress: (choices) => {
        console.log(`[groq]process`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[groq]result`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 50000);
});
