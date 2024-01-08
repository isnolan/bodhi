import * as types from '@/types';
export class ChatBaseAPI {
  protected provider: string = '';

  protected agent?: string = '';
  protected baseURL: string = '';
  protected apiKey: string = '';
  protected timeout?: number = 10000;

  constructor(opts: types.chat.ChatOptions) {
    opts.agent && (this.agent = opts.agent);
    opts.baseURL && (this.baseURL = opts.baseURL);
    opts.apiKey && (this.apiKey = opts.apiKey);
    opts.timeout && (this.timeout = opts.timeout);
  }

  public models(): string[] {
    throw new Error('Not implemented');
  }

  public async sendMessage(opts: types.chat.SendOptions | types.image.SendOptions): Promise<any> {
    throw new Error('Not implemented');
  }

  public async getTaskResult(task_id: string): Promise<any> {
    throw new Error('Not implemented');
  }
}
