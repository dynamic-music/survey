import { Component } from '@angular/core';
import { Platform, LoadingController, Loading } from 'ionic-angular';

import { DymoManager, GlobalVars, UIControl, uris, DymoGenerator } from 'dymo-core';

import { ConfigService, PlayerConfig, DymoConfig } from './config.service';
import { FetchService } from './fetch.service';
import { InnoyicSliderWrapper } from './innoyic-slider-wrapper';
import { AccelerationService } from './sensors/acceleration.service';
import { OrientationService } from './sensors/orientation.service';
import { GeolocationService } from './sensors/geolocation.service';

import { LiveDymo } from './live-dymo';

@Component({
  selector: 'semantic-player',
  templateUrl: 'player.component.html'
})
export class PlayerComponent {

  private config: PlayerConfig = {};
  private showSensorData: boolean;
  private loading: Loading;
  private sliders: InnoyicSliderWrapper[];
  private toggles: UIControl[];
  private buttons: UIControl[];

  manager: DymoManager;
  selectedDymo: DymoConfig;

  constructor(private platform: Platform,
    private loadingController: LoadingController,
    private configService: ConfigService,
    private fetcher: FetchService,
    private acceleration: AccelerationService,
    private orientation: OrientationService,
    private geolocation: GeolocationService
  ) { }

  async ngOnInit() {
    GlobalVars.LOGGING_ON = true; //TURN OFF IF NOT DEBUGGING
    this.config = await this.configService.getConfig();
    if (this.config.loadLiveDymo) {
      this.config.showDymoSelector = false;
    } else {
      this.selectedDymo = this.config.dymos[0];
    }
    this.loadOrCreateDymo();
  }

  dymoSelected() {
    this.loadOrCreateDymo();
  }

  private async loadOrCreateDymo() {
    this.resetUI();
    this.showLoadingDymo();
    this.manager = new DymoManager(undefined, null, null, null, 'assets/impulse_rev.wav', this.fetcher);
    await this.manager.init('https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/')
    if (this.config.loadLiveDymo) {
      new LiveDymo(new DymoGenerator(this.manager.getStore())).create();
      await this.manager.loadFromStore();
    } else if (this.selectedDymo) {
      await this.manager.loadIntoStore(this.selectedDymo.saveFile);
    }
    this.initSensorsAndUI();
    this.hideLoading();
  }

  private initSensorsAndUI() {
    if (this.platform.is('cordova')) {
      //init sensors
      const watcherLookup = new Map([
        [uris.ACCELEROMETER_X, this.acceleration.watchX],
        [uris.ACCELEROMETER_Y, this.acceleration.watchY],
        [uris.ACCELEROMETER_Z, this.acceleration.watchZ],
        [uris.COMPASS_HEADING, this.orientation.watch],
        [uris.GEOLOCATION_LATITUDE, this.geolocation.watchLatitude],
        [uris.GEOLOCATION_LONGITUDE, this.geolocation.watchLongitude],
      ]);
      this.manager.getSensorControls().forEach(control => {
        if (watcherLookup.has(control.getType())) {
          control.setSensor({
            watch: watcherLookup.get(control.getType())
          });
          control.startUpdate();
        }
      });
    }
    //init ui
    this.manager.getUIControls().forEach(control => {
      switch (control.getType()) {
        case uris.SLIDER: this.sliders.push(new InnoyicSliderWrapper(control)); break;
        case uris.TOGGLE: this.toggles.push(control); break;
        case uris.BUTTON: this.buttons.push(control); break;
      }
    });
  }

  resetUI(): void {
    this.sliders = [];
    this.toggles = [];
    this.buttons = [];
    if (this.manager) {
      this.manager.stopPlaying();
    }
  }

  toggleSensorData(): void {
    this.showSensorData = !this.showSensorData;
  }

  showLoadingDymo(): void {
    this.initOrUpdateLoader('Loading dymo...');
  }

  hideLoading(): void {
    this.loading.dismissAll();
    this.loading = null;
  }

  initOrUpdateLoader(content: string): void {
    if (!this.loading) {
      this.loading = this.loadingController.create({
        content: content
      });
      this.loading.present();
    } else {
      this.loading.setContent(content);
    }
  }

}
