import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Stream } from 'stream';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.PROXY_URL || !process.env.QCLOUD_SECRET_ID) {
      console.log('Skipping test due to missing environment variables');
      pending();
    }
  });

  const client = new tencentcloud.hunyuan.v20230901.Client({
    credential: {
      secretId: process.env.QCLOUD_SECRET_ID,
      secretKey: process.env.QCLOUD_SECRET_KEY,
    },
    // region: 'ap-chengdu',
    profile: {
      signMethod: 'TC3-HMAC-SHA256',
      httpProfile: {
        reqMethod: 'POST',
        reqTimeout: 30,
        endpoint: 'hunyuan.tencentcloudapi.com',
      },
    },
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res: any = await client.ChatPro({
      TopP: 0,
      Temperature: 0,
      Messages: [{ Role: 'user', Content: '计算1+1' }],
    });

    // 或者
    for await (let message of res) {
      console.log(`->`, message);
    }
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
