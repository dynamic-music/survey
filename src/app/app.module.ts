import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule, Injectable, Inject } from '@angular/core';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { AppComponent } from './app.component';
import { PlayerComponent } from './player.component';

import { ConfigService } from './config.service';
import { FetchService } from './fetch.service';

import {Observable} from 'rxjs/Observable';

@Injectable()
export class AccelerometerSensor {
  constructor(@Inject('AccelerationObservable') protected obs: Observable<Acceleration>) {}
}


// This isn't really idiomatic angular (the use of browser specific events and window object)
export interface Acceleration {
  x: number;
  y: number;
  z: number;
}

export function createAccelerationObservable(): Observable<Acceleration> {
  return Observable.fromEvent(window, 'devicemotion', (ev: DeviceMotionEvent) => ({
    x: ev.accelerationIncludingGravity.x,
    y: ev.accelerationIncludingGravity.y,
    z: ev.accelerationIncludingGravity.z,
  })).share();
}

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(AppComponent)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    AppComponent,
    PlayerComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    ConfigService,
    FetchService,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: 'AccelerationObservable', useFactory: createAccelerationObservable}
  ]
})
export class AppModule {}
