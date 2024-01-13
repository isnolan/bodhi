import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.PROXY_URL || !process.env.QCLOUD_SECRET_ID) {
      console.log('Skipping test due to missing environment variables');
      pending();
    }
  });

  const api = new ChatAPI(Provider.TENCENT_HUNYUAN, {
    apiKey: process.env?.QCLOUD_SECRET_ID as string,
    apiSecret: process.env?.QCLOUD_SECRET_KEY as string,
    agent: process.env.PROXY_URL as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'ChatStd',
      messages: [
        // { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
        // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      onProgress: (choices: any) => {
        console.log(`[gemini]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[gemini]result:`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
