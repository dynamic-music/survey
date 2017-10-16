import { Component, Inject } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Acceleration } from './app.module';
import {Observable} from 'rxjs/Observable';

import { PlayerComponent } from './player.component';
@Component({
  templateUrl: 'app.html'
})
export class AppComponent {
  rootPage:any = PlayerComponent;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    @Inject('AccelerationObservable') private onOrientation: Observable<Acceleration>
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      onOrientation.subscribe((acc) => {
        console.log(acc),
        err => { console.error(err); }
      });
    });
  }
}

