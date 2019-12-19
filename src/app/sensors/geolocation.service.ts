import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';


@Injectable()
export class GeolocationService {

  private options = {timeout: 5000, enableHighAccuracy: true};
  public watchLatitude: Observable<number>;
  public watchLongitude: Observable<number>;
  public watchPosition: Observable<[number,number]>;

  constructor(private geolocation: Geolocation) {
    this.watchLatitude = this.geolocation.watchPosition(this.options)
      .pipe(map((g:any) => g.coords.latitude));
    this.watchLongitude = this.geolocation.watchPosition(this.options)
      .pipe(map((g:any) => g.coords.longitude));
    this.watchPosition = this.geolocation.watchPosition(this.options)
      .pipe(map((g:any) => <[number,number]>[g.coords.latitude, g.coords.longitude]));
  }
  
  async getCurrentPosition(): Promise<[number,number]> {
    const position = await this.geolocation.getCurrentPosition(this.options);
    return [position.coords.latitude, position.coords.longitude];
  }

}