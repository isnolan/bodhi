import { AliyunWanxAPI } from '@/provider';
import { ChatBaseAPI } from '@/provider/base';

import * as types from '@/types';

export class ImageAPI {
  private provider: ChatBaseAPI | null = null;

  constructor(provider: string, opts: types.chat.ChatOptions) {
    switch (provider) {
      case types.Provider.ALIYUN_WANX:
        this.provider = new AliyunWanxAPI(opts);
        break;
      default:
        throw new Error(`Unsupported supplier: ${provider}`);
    }
  }

  public async sendMessage(opts: types.image.SendOptions) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.sendMessage(opts);
  }

  public async getTaskResult(task_id: string) {
    if (!this.provider) {
      throw new Error('Provider is not initialized');
    }
    return await this.provider.getTaskResult(task_id);
  }
}
