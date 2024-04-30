import OSS from 'ali-oss';
import * as dotenv from 'dotenv';
import { Readable } from 'stream';
dotenv.config({ path: ['.env', '.env.development', '.env.production'] });

/**
 *
 * https://www.jianshu.com/p/482422628150
 * https://github.com/1019058432/nest_CRUD_base/blob/e0710687f963e62ae8ea5917966c43c042ae845d/src/components/Oss/index.ts
 *
 */
const client = new OSS({
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
  accessKeyId: process.env.OSS_ACCESS_KEY,
  accessKeySecret: process.env.OSS_ACCESS_SECRET,
});

function bufferToStream(binary) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });
  return readableInstanceStream;
}

export async function putStream(filepath, file) {
  try {
    // const filepath = '/uploads/avatar/b.jpg';
    const result = await client.putStream(filepath, bufferToStream(file.buffer));
    return result;
  } catch (err) {
    console.error(err.message);
  }
}
