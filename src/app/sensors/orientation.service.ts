import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { DeviceOrientation } from '@ionic-native/device-orientation';


@Injectable()
export class OrientationService {

  public watch: Observable<number>;

  constructor(private deviceOrientation: DeviceOrientation) {
    this.watch = this.deviceOrientation.watchHeading()
      .map(h => h.trueHeading/360);
  }

}