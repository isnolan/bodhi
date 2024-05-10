import * as path from 'path';
import * as dotenv from 'dotenv';
import { Provider } from '@/types';
import { ChatAPI } from '@/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.DEEKSEEK_API_KEY) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.DEEPSEEK, {
    apiKey: process.env?.DEEKSEEK_API_KEY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'deepseek-chat',
      messages: [
        // { role: 'system', parts: [{ type: 'text', text: '你是一位资深的儿童作家，擅长写作高情商儿童故事' }] },
        // { role: 'user', parts: [{ type: 'text', text: '白雪公主与七个小矮人' }] },
        { role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      ],
      onProgress: (choices) => {
        console.log(`[deepseek]process`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[deepseek]result`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 100000);
});
