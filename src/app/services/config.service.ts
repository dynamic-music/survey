import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

export interface PlayerConfig {
  showTitle?: boolean,
  title?: string,
  showDymoSelector?: boolean,
  showPlaybackButtons?: boolean,
  showDymoControls?: boolean,
  showSensorSection?: boolean,
  autoplay?: boolean,
  loadLiveDymo?: boolean,
  dymos?: DymoConfig[]
}

export interface DymoConfig {
  name: string,
  saveFile: string
}

@Injectable()
export class ConfigService {

  constructor(private http: Http) {}

  async getConfig(): Promise<PlayerConfig> {
    return this.http.get('assets/config.json')
      .toPromise()
      .then(response => response.json())
      .catch((error: any) => {
        console.error(error);
        return Promise.reject(error.message || error);
      });
  }

};
