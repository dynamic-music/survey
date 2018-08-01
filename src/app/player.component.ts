import { Component } from '@angular/core';
import { Platform, LoadingController, Loading } from 'ionic-angular';

import { DymoPlayerManager } from 'dymo-player';
import { UIControl, uris, DymoGenerator } from 'dymo-core';

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
    if (this.config.autoplay) this.play();
  }

  ////functions called from ui

  dymoSelected() {
    this.loadOrCreateDymo();
  }

  play() {
    this.player.startPlaying();
  }

  pause() {
    this.player.pause();
  }

  stop() {
    this.player.stopPlaying();
  }

  toggleSensorData(): void {
    this.showSensorData = !this.showSensorData;
  }

  private async loadOrCreateDymo() {
    this.resetUI();
    this.showLoadingDymo();
    this.player = new DymoPlayerManager(false, false, undefined, undefined, undefined, this.fetcher);
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
      this.player.stopPlaying();
    }
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
