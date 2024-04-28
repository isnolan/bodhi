import * as dotenv from 'dotenv';
import * as path from 'path';
import { Provider, ChatAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.QCLOUD_SECRET_ID) {
      console.log('Skipping test due to missing environment variables');
      pending();
    }
  });

  const api = new ChatAPI(Provider.QCLOUD_HUNYUAN, {
    apiKey: process.env?.QCLOUD_SECRET_ID as string,
    apiSecret: process.env?.QCLOUD_SECRET_KEY as string,
    agent: process.env.HTTP_PROXY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'hunyuan-lite',
      top_p: 0.9,
      messages: [
        // { role: 'user', parts: [{ type: 'text', text: 'Hello, 我们家有两只狗' }] },
        // { role: 'assistant', parts: [{ type: 'text', text: 'Great to meet you. What would you like to know?' }] },
        { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      onProgress: (choices: any) => {
        // console.log(`[hunyuan]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[hunyuan]result:`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
