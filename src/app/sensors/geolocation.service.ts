import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';


@Injectable()
export class GeolocationService {

  public watchLatitude: Observable<number>;
  public watchLongitude: Observable<number>;

  constructor(private geolocation: Geolocation) {
    this.watchLatitude = this.geolocation.watchPosition()
      .pipe(map((g:any) => g.coords.latitude));
    this.watchLongitude = this.geolocation.watchPosition()
      .pipe(map((g:any) => g.coords.longitude));
  }

}