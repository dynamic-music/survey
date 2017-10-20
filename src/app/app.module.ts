import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { AppComponent } from './app.component';
import { PlayerComponent } from './player.component';

import { ConfigService } from './config.service';
import { FetchService } from './fetch.service';
import { 
  AccelerationService,
  createAccelerationWatcherFrom,
  createDeviceMotionAccelerationObservable,
  toAccelerationServiceFactoryWith
} from './acceleration.service';

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
    {
      provide: AccelerationService,
      useFactory: toAccelerationServiceFactoryWith(
        createAccelerationWatcherFrom(
          createDeviceMotionAccelerationObservable(window)
        )
      )
    }
  ]
})
export class AppModule {}
