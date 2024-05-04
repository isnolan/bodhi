import fs from 'node:fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const credentials = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../.credentials/google-cloud.json'), 'utf8'),
);

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !credentials.client_email) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  it('ocr: process', async () => {
    const auth: GoogleAuth = new GoogleAuth({ credentials, scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const token = await auth.getAccessToken();
    const url =
      'https://us-documentai.googleapis.com/v1/projects/844941471694/locations/us/processors/d658747c1566a14b:process';
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      agent: new HttpsProxyAgent(process.env.HTTP_PROXY as string),
      body: JSON.stringify({
        skipHumanReview: true,
        gcsDocument: { mimeType: 'application/pdf', gcsUri: 'gs://bodhi-storage/IMG_0174.pdf' },
      }),
      method: 'POST',
    }).then((res) => res.json());
    console.log(`->res`, res);

    fs.writeFileSync(path.resolve(__dirname, 'ocr.json'), JSON.stringify(res, null, 2), 'utf8');
    expect(res).toBeInstanceOf(Object);
  }, 60000);

  it('ocr: batch', async () => {
    const auth: GoogleAuth = new GoogleAuth({ credentials, scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const token = await auth.getAccessToken();
    const url =
      'https://us-documentai.googleapis.com/v1/projects/844941471694/locations/us/processors/d658747c1566a14b:batchProcess';
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      agent: new HttpsProxyAgent(process.env.HTTP_PROXY as string),
      body: JSON.stringify({
        name: `projects/844941471694/locations/us/processors/d658747c1566a14b`,
        inputDocuments: {
          gcsDocuments: {
            documents: [{ gcsUri: 'gs://bodhi-storage/IMG_0174.pdf', mimeType: 'application/pdf' }],
          },
        },
        documentOutputConfig: {
          gcsOutputConfig: { gcsUri: 'gs://bodhi-storage/ocr/' },
        },
        skipHumanReview: true,
      }),
      method: 'POST',
    }).then((res) => res.json());
    console.log(`->res`, res);

    fs.writeFileSync(path.resolve(__dirname, 'ocr_batch.json'), JSON.stringify(res, null, 2), 'utf8');
    expect(res).toBeInstanceOf(Object);
  }, 60000);

  it('ocr: operation', async () => {
    const auth: GoogleAuth = new GoogleAuth({ credentials, scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const token = await auth.getAccessToken();
    const url =
      'https://us-documentai.googleapis.com/v1/projects/844941471694/locations/us/operations/11522573173077436010';
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      agent: new HttpsProxyAgent(process.env.HTTP_PROXY as string),
      method: 'GET',
    }).then((res) => res.json());
    console.log(`->res`, res);

    fs.writeFileSync(path.resolve(__dirname, 'ocr_operation.json'), JSON.stringify(res, null, 2), 'utf8');
    expect(res).toBeInstanceOf(Object);
  }, 60000);
});
