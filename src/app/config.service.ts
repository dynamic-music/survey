import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class ConfigService {

  constructor(private http: Http) {}

  getConfig(): Promise<Object> {
    return this.http.get('assets/config.json')
      .toPromise()
    //return fetch('assets/config.json')
      .then(response => response.json())
      .catch((error: any) => {
        console.error(error);
        return Promise.reject(error.message || error);
      });
  }

};
