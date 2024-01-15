import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

export const toUtf8 = (input: Uint8Array): string => new TextDecoder('utf-8').decode(input);

export async function requestWithAuth(options: any, request: any): Promise<HttpRequest> {
  const { accessKeyId, secretAccessKey, region, service } = options;
  const credentials = { accessKeyId, secretAccessKey };
  // sign request
  const signed = await new SignatureV4({ region, service, sha256: Sha256, credentials }).sign(new HttpRequest(request));
  return signed as HttpRequest;
}
