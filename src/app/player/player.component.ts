import { Component } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Observable } from 'rxjs';

import { DymoPlayer } from 'dymo-player';
import { UIControl, SensorControl, uris, DymoGenerator } from 'dymo-core';

import { ConfigService, PlayerConfig, DymoConfig } from '../services/config.service';
import { FetchService } from '../services/fetch.service';
import { AccelerationService } from '../sensors/acceleration.service';
import { OrientationService } from '../sensors/orientation.service';
import { GeolocationService } from '../sensors/geolocation.service';
import { InnoyicSliderWrapper } from '../controls/innoyic-slider-wrapper';
import { AreaControl, AreaControlType } from '../controls/area-control';

import { LiveDymo } from '../live-dymo';

import * as _ from 'lodash';

@Component({
  selector: 'semantic-player',
  templateUrl: 'player.component.html'
})
export class PlayerComponent {

  protected config: PlayerConfig = {};
  protected showSensorData: boolean;
  private loading: Promise<HTMLIonLoadingElement>;
  private sensors: SensorControl[];
  private sliders: InnoyicSliderWrapper[];
  private toggles: UIControl[];
  private buttons: UIControl[];
  private areas: AreaControl[];
  protected performanceInfo: string;
  private numPlayingDymos: number;
  private numLoadedBuffers: number;
  private mouseDown = false;

  player: DymoPlayer;
  selectedDymo: DymoConfig;
  private loadedDymo: DymoConfig;

  constructor(private platform: Platform,
    private loadingController: LoadingController,
    private configService: ConfigService,
    private fetcher: FetchService,
    private androidPermissions: AndroidPermissions,
    private acceleration: AccelerationService,
    private orientation: OrientationService,
    private geolocation: GeolocationService
  ) { }

  async ngOnInit() {
    console.log("waiting...")
    await this.platform.ready();
    if (this.platform.is('cordova')) {
      const permission = await this.androidPermissions
        .checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION);
      console.log("HASPERMISSION", permission.hasPermission);
      if (!permission.hasPermission) await this.androidPermissions
        .requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION);
    }
    console.log("ready")
    this.config = await this.configService.getConfig();
    if (this.config.loadLiveDymo) {
      this.config.showDymoSelector = false;
    } else {
      this.selectedDymo = this.config.dymos[0];
    }
    await this.loadOrCreateDymo();
    //setInterval(this.updatePerformanceInfo.bind(this), 500);
    this.player.getPlayingDymoUris().subscribe(d => this.numPlayingDymos = d.length);
    this.player.getAudioBank().getBufferCount().subscribe(n => this.numLoadedBuffers = n);
    if (this.config.autoplay) this.play();
  }

  ////functions called from ui

  protected dymoSelected() {
    this.loadOrCreateDymo();
  }

  protected play() {
    if (!this.player.isPlaying()) this.player.play();
  }

  protected pause() {
    this.player.pause();
  }

  protected stop() {
    this.player.stop();
  }

  protected toggleSensorData(): void {
    this.showSensorData = !this.showSensorData;
  }

  protected resetSensors(): void {
    this.sensors.forEach(s => s.reset());
  }

  ////internal functions

  private async updatePerformanceInfo() {
    let info: string[] = [];
    const store = this.player.getDymoManager().getStore();
    info.push("triples: " + await store.size());
    info.push("observers: " + await store.getValueObserverCount());
    info.push("dymos: " + this.numPlayingDymos);
    info.push("buffers: " + this.numLoadedBuffers);
    this.performanceInfo = info.join(', ');
  }

  private async loadOrCreateDymo() {
    if (this.selectedDymo != this.loadedDymo) {
      this.loadedDymo = this.selectedDymo;
      this.resetUI();
      this.showLoadingDymo();
      this.player = new DymoPlayer({
        useWorkers: false,
        scheduleAheadTime: 4,
        loadAheadTime: 8,
        fetcher: this.fetcher,
        ignoreInaudible: true,
        loggingOn: true,
        fadeLength: 0.03,
        useTone: true,
        preloadBuffers: true
      });
      await this.player.init('https://raw.githubusercontent.com/dynamic-music/dymo-core/master/ontologies/');
      if (this.config.loadLiveDymo) {
        await new LiveDymo(new DymoGenerator(false, this.player.getDymoManager().getStore())).create();
        await this.player.getDymoManager().loadFromStore();
      } else if (this.selectedDymo) {
        await this.player.loadDymo(this.selectedDymo.saveFile);
      }
      this.initSensorsAndUI();
      this.sliders.forEach(s => {s.uiValue = _.random(1000); s.update()});
      this.hideLoading();
    }
  }

  private initSensorsAndUI() {
    if (this.platform.is('cordova')) {
      //init sensors
      const watcherLookup: Map<string, Observable<number>> = new Map([
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
        case uris.AREA_X: this.addOrSetAreaControl(AreaControlType.X, control); break;
        case uris.AREA_Y: this.addOrSetAreaControl(AreaControlType.Y, control); break;
        case uris.AREA_A: this.addOrSetAreaControl(AreaControlType.A, control); break;
      }
    });
  }
  
  private addOrSetAreaControl(type: AreaControlType, control: UIControl) {
    if (!this.areas.find(a => a.setControl(type, control))) {
      this.areas.push(new AreaControl());
      _.last(this.areas).setControl(type, control);
    }
    _.last(this.areas).setImage("assets/dymos/deadhead/clustering.jpg");
  }

  private resetUI(): void {
    this.sliders = [];
    this.toggles = [];
    this.buttons = [];
    this.areas = [];
    if (this.player) {
      this.player.stop();
    }
  }

  private showLoadingDymo(): void {
    this.initOrUpdateLoader('Loading dymo...');
  }

  private async hideLoading() {
    if (this.loading) (await this.loading).dismiss();
    this.loading = null;
  }

  private async initOrUpdateLoader(content: string) {
    if (!this.loading) {
      this.loading = this.loadingController.create({
        message: content
      });
      (await this.loading).present();
    } else {
      (await this.loading).message = content;
    }
  }

}
