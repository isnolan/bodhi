import fetch from 'node-fetch';
import { createParser, ParseEvent } from 'eventsource-parser';

export class FetchError extends Error {
  code: number;
  message: string;

  constructor(message: string, code: number) {
    super(message); // 调用父类的构造函数
    this.name = 'FetchError'; // 设置错误名称
    this.code = code; // 设置状态码
    this.message = message; // 设置状态文本
    // 当使用 TypeScript 的 target 为 ES5 时，需要以下设置，以便能够正确捕获堆栈跟踪
    // Object.setPrototypeOf(this, new.target.prototype);
  }
}

export async function fetchSSE(
  url: string,
  options: Parameters<typeof fetch>[1] & {
    onMessage: (event: ParseEvent) => void;
  },
) {
  return new Promise(async (resolve, reject) => {
    const { onMessage, ...fetchOptions } = options;
    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      let reason: string;

      try {
        reason = await res.json();
      } catch (err) {
        reason = res.statusText;
      }

      throw new FetchError(reason, res.status);
    }

    // only get content from node-fetch
    const body: NodeJS.ReadableStream = res.body as any;
    if (!body.on || !body.read) {
      throw new FetchError('unsupported "fetch" implementation', 500);
    }

    const parser = createParser((event: ParseEvent) => {
      onMessage(event);
      console.log(`[fetch]sse`, event);
    });
    body.on('readable', () => {
      let chunk: string | Buffer;
      while (null !== (chunk = body.read())) {
        parser.feed(chunk.toString());
      }
    });
    body.on('error', (err) => reject(new FetchError(err.message, 500)));
    body.on('end', () => resolve({}));
    // console.log(`[fetch]finished!`, res);
  });
}
