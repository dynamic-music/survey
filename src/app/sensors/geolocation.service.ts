import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';


@Injectable()
export class GeolocationService {

  public watchLatitude: Observable<number>;
  public watchLongitude: Observable<number>;

  constructor(private geolocation: Geolocation) {
    this.watchLatitude = this.geolocation.watchPosition().map(g => g.coords.latitude);
    this.watchLongitude = this.geolocation.watchPosition().map(g => g.coords.longitude);
  }

}