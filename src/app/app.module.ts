import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { DeviceOrientation } from '@ionic-native/device-orientation';
import { Geolocation } from '@ionic-native/geolocation';

import { AppComponent } from './app.component';
import { PlayerComponent } from './player.component';

import { ConfigService } from './config.service';
import { FetchService } from './fetch.service';
import {
  AccelerationService,
  createAccelerationWatcherFrom,
  createDeviceMotionAccelerationObservable,
  toAccelerationServiceFactoryWith
} from './sensors/acceleration.service';
import { OrientationService } from './sensors/orientation.service';
import { GeolocationService } from './sensors/geolocation.service';

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
    DeviceOrientation,
    Geolocation,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {
      provide: AccelerationService,
      useFactory: toAccelerationServiceFactoryWith(
        createAccelerationWatcherFrom(
          createDeviceMotionAccelerationObservable(window)
        )
      )
    },
    OrientationService,
    GeolocationService
  ]
})
export class AppModule {}
