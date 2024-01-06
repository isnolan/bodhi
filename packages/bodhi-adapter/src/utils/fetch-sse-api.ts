import fetch from 'node-fetch';
import { createParser } from 'eventsource-parser';

export class FetchError extends Error {
  statusCode: number;
  statusText: string;

  constructor(message: string, statusCode: number) {
    super(message); // 调用父类的构造函数
    this.name = 'FetchError'; // 设置错误名称
    this.statusCode = statusCode; // 设置状态码
    this.statusText = message; // 设置状态文本
    // 当使用 TypeScript 的 target 为 ES5 时，需要以下设置，以便能够正确捕获堆栈跟踪
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export async function fetchSSE(
  url: string,
  options: Parameters<typeof fetch>[1] & {
    onMessage: (data: string) => void;
    onError?: (error: any) => void;
  },
) {
  const { onMessage, onError, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let reason: string;

    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }

    throw new FetchError(reason, res.status);
  }

  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data);
    }
  });

  // only get content from node-fetch
  const body: NodeJS.ReadableStream = res.body as any;
  if (!body.on || !body.read) {
    throw new FetchError('unsupported "fetch" implementation', 500);
  }

  body.on('readable', () => {
    let chunk: string | Buffer;
    while (null !== (chunk = body.read())) {
      parser.feed(chunk.toString());
    }
  });
}
