import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs, ResponseContentType } from '@angular/http';
import { Fetcher } from 'dymo-core';

@Injectable()
export class FetchService implements Fetcher {

  constructor(private http: Http) {}

  fetchText(url: string): Promise<string> {
    return this.fetch(url)
      .then(r => r.text());
  }

  fetchJson(url: string): Promise<{}> {
    return this.fetch(url)
      .then(r => r.json());
  }

  fetchArrayBuffer(url: string): Promise<any> {
    return this.fetch(url, { responseType: ResponseContentType.ArrayBuffer })
      .then(r => r.arrayBuffer());
  }

  private fetch(url: string, options?: RequestOptionsArgs): Promise<Response> {
    return this.http.get(url, options)
      .toPromise();
  }

}