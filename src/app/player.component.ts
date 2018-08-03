import { Component } from '@angular/core';
import { Platform, LoadingController, Loading } from 'ionic-angular';

import { DymoPlayerManager } from 'dymo-player';
import { UIControl, SensorControl, uris, DymoGenerator } from 'dymo-core';

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
  private sensors: SensorControl[];
  private sliders: InnoyicSliderWrapper[];
  private toggles: UIControl[];
  private buttons: UIControl[];
  private performanceInfo: string;

  player: DymoPlayerManager;
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
    this.config = await this.configService.getConfig();
    if (this.config.loadLiveDymo) {
      this.config.showDymoSelector = false;
    } else {
      this.selectedDymo = this.config.dymos[0];
    }
    await this.loadOrCreateDymo();
    setInterval(this.updatePerformanceInfo.bind(this), 500);
    if (this.config.autoplay) this.play();
  }

  ////functions called from ui

  dymoSelected() {
    this.loadOrCreateDymo();
  }

  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  stop() {
    this.player.stop();
  }

  private toggleSensorData(): void {
    this.showSensorData = !this.showSensorData;
  }

  private async updatePerformanceInfo() {
    const observers = await this.player.getDymoManager().getStore().getValueObserverCount();
    this.performanceInfo = "observers: " + observers;
  }

  private async loadOrCreateDymo() {
    this.resetUI();
    this.showLoadingDymo();
    this.player = new DymoPlayerManager(true, false, 0.5, 1, undefined, this.fetcher);
    await this.player.init('https://raw.githubusercontent.com/dynamic-music/dymo-core/master/ontologies/')
    if (this.config.loadLiveDymo) {
      await new LiveDymo(new DymoGenerator(this.player.getDymoManager().getStore())).create();
      await this.player.getDymoManager().loadFromStore();
    } else if (this.selectedDymo) {
      await this.player.getDymoManager().loadIntoStore(this.selectedDymo.saveFile);
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
      this.player.getDymoManager().getSensorControls().forEach(control => {
        if (watcherLookup.has(control.getType())) {
          this.sensors.push(control);
          control.setSensor({
            watch: watcherLookup.get(control.getType())
          });
          control.startUpdate();
        }
      });
    }
    //init ui
    this.player.getDymoManager().getUIControls().forEach(control => {
      switch (control.getType()) {
        case uris.SLIDER: this.sliders.push(new InnoyicSliderWrapper(control)); break;
        case uris.TOGGLE: this.toggles.push(control); break;
        case uris.BUTTON: this.buttons.push(control); break;
      }
    });
  }

  private resetUI(): void {
    this.sliders = [];
    this.toggles = [];
    this.buttons = [];
    if (this.player) {
      this.player.stop();
    }
  }

  private resetSensors(): void {
    this.sensors.forEach(s => s.reset());
  }

  private showLoadingDymo(): void {
    this.initOrUpdateLoader('Loading dymo...');
  }

  private hideLoading(): void {
    this.loading.dismissAll();
    this.loading = null;
  }

  private initOrUpdateLoader(content: string): void {
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
