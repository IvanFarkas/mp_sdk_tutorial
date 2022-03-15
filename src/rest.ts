// typed-rest-client - https://github.com/Microsoft/typed-rest-client/blob/HEAD/test/tests/resttests.ts
import * as rm from 'typed-rest-client/RestClient';
import * as cm from './common';

// TODO: This should be in polyfill, but could not get it work, export, etc.
global.Buffer = global.Buffer || require('buffer').Buffer;

interface HttpBinData {
  url: string;
  data: any;
  json: any;
  args?: any;
}

interface HelloObj {
  message: string;
}

let baseUrl: string = 'https://httpbin.org/';
let client: rm.RestClient = new rm.RestClient('rest-samples', baseUrl);
let hello: HelloObj = <HelloObj>{ message: 'Hello World!' };
let options: rm.IRequestOptions = cm.httpBinOptions();

export async function run() {
  try {
    await get();
    await post();
    await update();
  } catch (err) {
    console.error('Failed: ' + err.message);
  }
}

async function get() {
  let options: rm.IRequestOptions = {
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
  let response: rm.IRestResponse<cm.HttpBinData> = await client.get<cm.HttpBinData>('get', options);
  console.log(response.statusCode, response.result['url']);
}

async function post() {
  // Create and Update Resource(s)
  // Generics <T,R> are the type sent and the type returned in the body.  Ideally the same in REST service
  cm.heading('REST POST');
  let hres: rm.IRestResponse<HelloObj> = await client.create<HelloObj>('/post', hello, options);
  console.log(hres.result);
}

async function update() {
  cm.heading('REST PATCH');
  hello.message += '!';

  // Specify a full url (not relative) per request
  let hres: rm.IRestResponse<HelloObj> = await client.update<HelloObj>(
    baseUrl + 'patch',
    hello,
    options
  );
  console.log(hres.result);

  cm.heading('REST options');
  let ores: rm.IRestResponse<void> = await client.options<void>('', options);
  console.log(ores.statusCode);
}
