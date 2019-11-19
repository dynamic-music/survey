import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { DeviceOrientation } from '@ionic-native/device-orientation/ngx';


@Injectable()
export class OrientationService {

  public watch: Observable<number>;

  constructor(private deviceOrientation: DeviceOrientation) {
    this.watch = this.deviceOrientation.watchHeading()
      //.map(h => h.trueHeading/360);
      .pipe(map((h:any) => h.trueHeading/360));
  }

}