// https://github.com/microsoft/typed-rest-client/tree/master/samples
import * as http from 'http';
import * as restm from 'typed-rest-client/RestClient';

// using httpbin.org.
export interface HttpBinData {
  url: string;
  data: any;
}

export function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function banner(title: string): void {
  console.log();
  console.log('=======================================');
  console.log('\t' + title);
  console.log('=======================================');
}

export function heading(title: string): void {
  console.log();
  console.log('> ' + title);
}

// Utility functions
export async function outputHttpBinResponse(body: string, message?: http.IncomingMessage) {
  if (message) {
    if (message.statusCode) {
      console.log('status', message.statusCode);
    }
    if (message.rawHeaders) {
      console.log('headers:' + JSON.stringify(message.rawHeaders));
    }
  }
  if (body) {
    const obj = JSON.parse(body.toString());

    console.log('response from ' + obj.url);
    if (obj.data) {
      console.log('data:', obj.data);
    }
  }
}

// This is often not needed.
// In this case, using httpbin.org which echos the object in the data property of the json.
// It's an artifact of sample service used.
// But it's useful to note that we do offer a processing function which is invoked on the returned json.
export function httpBinOptions(): restm.IRequestOptions {
  const options: restm.IRequestOptions = {} as restm.IRequestOptions;

  options.responseProcessor = (obj: any) => {
    return obj.data;
  };
  return options;
}
