import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';


@Injectable()
export class GeolocationService {

  public watchLatitude: Observable<number>;
  public watchLongitude: Observable<number>;
  public watchPosition: Observable<[number,number]>;

  constructor(private geolocation: Geolocation) {
    this.watchLatitude = this.geolocation.watchPosition()
      .pipe(map((g:any) => g.coords.latitude));
    this.watchLongitude = this.geolocation.watchPosition()
      .pipe(map((g:any) => g.coords.longitude));
    this.watchPosition = this.geolocation.watchPosition()
      .pipe(map((g:any) => <[number,number]>[g.coords.latitude, g.coords.longitude]));
  }

}