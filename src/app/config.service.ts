import { Injectable } from '@angular/core';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class ConfigService {

  constructor() {}

  getConfig(): Promise<Object> {
    return fetch('assets/config.json')
      .then(response => response.json())
      .catch((error: any) => {
        console.error(error);
        return Promise.reject(error.message || error);
      });
  }

};
