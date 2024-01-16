import { setTimeout } from 'node:timers/promises';
import { describe, expect, test } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { Provider, ImageAPI } from '../src/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.PROXY_URL || !process.env.ALIYUN) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ImageAPI(Provider.ALIYUN_WANX, {
    apiKey: process.env?.ALIYUN as string,
    agent: process.env.PROXY_URL as string,
  });

  it('image: from prompt', async () => {
    let res = await api.sendMessage({
      model: 'wanx-v1',
      prompt: '一只奔跑的猫',
    });
    console.log(`[aliyun]wanx`, res);
    expect(res).toBeInstanceOf(Object);

    const task_id = res.task_id;
    while (['PENDING', 'RUNNING'].includes(res.task_status)) {
      await setTimeout(1000);
      res = await api.getTaskResult(task_id);
    }
    console.log(`[aliyun]wanx`, res);
    expect(res).toBeInstanceOf(Object);
  }, 30000);
});
