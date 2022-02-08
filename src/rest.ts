// typed-rest-client - https://github.com/Microsoft/typed-rest-client/blob/HEAD/test/tests/resttests.ts
import * as rm from 'typed-rest-client/RestClient';
import * as cm from './common';
import * as buffer from 'buffer';

// TODO: This should be in polyfill, but could not get it work, export, etc.
global.Buffer = global.Buffer || buffer.Buffer;

interface HttpBinData {
  url: string;
  data: any;
  json: any;
  args?: any;
}

interface HelloObj {
  message: string;
}

const baseUrl: string = 'https://httpbin.org/';
const client: rm.RestClient = new rm.RestClient('rest-samples', baseUrl);
const hello: HelloObj = {message: 'Hello World!'} as HelloObj;
const options: rm.IRequestOptions = cm.httpBinOptions();

export async function run() {
  try {
    await get();
    await post();
    await update();
  } catch (err: any) {
    console.error('Failed: ' + err.message);
  }
}

async function get() {
  const requestOptions: rm.IRequestOptions = {
    queryParameters: {
      params: {
        id: 1,
        type: 'compact',
      },
    },
  };

  // Get Resource: strong typing of resource(s) via generics.
  // In this case httpbin.org has a response structure response.result carries the resource(s)
  cm.heading('REST GET');

  const response: rm.IRestResponse<cm.HttpBinData> = await client.get<cm.HttpBinData>('get', requestOptions);

  // console.log(response.statusCode, response.result['url']); // TODO: Fix
}

async function post() {
  // Create and Update Resource(s)
  // Generics <T,R> are the type sent and the type returned in the body.  Ideally the same in REST service
  cm.heading('REST POST');
  const hres: rm.IRestResponse<HelloObj> = await client.create<HelloObj>('/post', hello, options);

  console.log(hres.result);
}

async function update() {
  cm.heading('REST PATCH');
  hello.message += '!';

  // Specify a full url (not relative) per request
  const hres: rm.IRestResponse<HelloObj> = await client.update<HelloObj>(baseUrl + 'patch', hello, options);
  console.log(hres.result);

  cm.heading('REST options');
  const ores: rm.IRestResponse<void> = await client.options<void>('', options);
  console.log(ores.statusCode);
}
