import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { DeviceMotion } from '@ionic-native/device-motion/ngx';
import { DeviceOrientation } from '@ionic-native/device-orientation/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PlayerComponent } from './player/player.component';

import { ConfigService } from './services/config.service';
import { FetchService } from './services/fetch.service';
import { OverpassService } from './services/overpass.service';
import { WeatherService } from './services/weather.service';
import { AccelerationService } from './sensors/acceleration.service';
import { OrientationService } from './sensors/orientation.service';
import { GeolocationService } from './sensors/geolocation.service';

@NgModule({
  declarations: [AppComponent, PlayerComponent],
  entryComponents: [],
  imports: [
    FormsModule,
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    AndroidPermissions,
    DeviceMotion,
    DeviceOrientation,
    Geolocation,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ConfigService,
    FetchService,
    OverpassService,
    WeatherService,
    AccelerationService,
    OrientationService,
    GeolocationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
