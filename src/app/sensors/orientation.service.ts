import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { DeviceOrientation } from '@ionic-native/device-orientation';


@Injectable()
export class OrientationService {

  public watch: Observable<number>;

  constructor(private deviceOrientation: DeviceOrientation) {
    this.watch = this.deviceOrientation.watchHeading()
      .map(h => { console.log(h); return h.trueHeading/360 });
  }

}