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

  const api = new ChatAPI(Provider.GOOGLE_CLAUDE, {
    baseURL: 'https://us-central1-aiplatform.googleapis.com/v1/projects/bodhi-415003/locations/us-central1',
    apiKey: credential.client_email,
    apiSecret: credential.private_key,
    agent: process.env.HTTP_PROXY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'claude-3-sonnet@20240229', //'claude-3-haiku@20240307',
      messages: [
        { role: 'user', parts: [{ type: 'text', text: '请写一篇关于我家小狗子的故事，要求字数不少于200字' }] },
      ],
      onProgress: (choices) => {
        console.log(`[claude]progress:`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });

    console.log(`[claude]result:`, JSON.stringify(res));
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
