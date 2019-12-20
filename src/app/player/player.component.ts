import { Component } from '@angular/core';
import { Platform, LoadingController, ModalController } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Observable } from 'rxjs';

import { DymoPlayer } from 'dymo-player';
import { UIControl, SensorControl, uris, DymoGenerator } from 'dymo-core';

import { ConfigService, PlayerConfig, DymoConfig } from '../services/config.service';
import { FetchService } from '../services/fetch.service';
import { InnoyicSliderWrapper } from '../controls/innoyic-slider-wrapper';
import { AreaControl } from '../controls/area-control';
import { AccelerationService } from '../sensors/acceleration.service';
import { OrientationService } from '../sensors/orientation.service';
import { GeolocationService } from '../sensors/geolocation.service';
import { OverpassService } from '../services/overpass.service';
import { WeatherService } from '../services/weather.service';

import { InfoComponent } from './info.component';

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
  private location: [number, number];
  protected contextName: string = "";
  protected contextIcon: string;

  player: DymoPlayer;
  selectedDymo: DymoConfig;

  constructor(private platform: Platform,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private configService: ConfigService,
    private fetcher: FetchService,
    private androidPermissions: AndroidPermissions,
    private acceleration: AccelerationService,
    private orientation: OrientationService,
    private geolocation: GeolocationService,
    private overpass: OverpassService,
    private weather: WeatherService
  ) { }

  async ngOnInit() {
    console.log("waiting...")
    await this.platform.ready();
    if (this.platform.is('cordova')) {
      const permission = await this.androidPermissions
        .checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION);
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
    this.resetUI();
    this.initOrUpdateLoader('Loading dymo...');
    this.player = new DymoPlayer({
      useWorkers: false,
      scheduleAheadTime: 3,
      loadAheadTime: 6,
      fetcher: this.fetcher,
      ignoreInaudible: true,
      loggingOn: false,
      fadeLength: 0.03,
      useTone: true
    });
    await this.player.init('https://raw.githubusercontent.com/dynamic-music/dymo-core/master/ontologies/');
    if (this.config.loadLiveDymo) {
      await new LiveDymo(new DymoGenerator(false, this.player.getDymoManager().getStore())).create();
      await this.player.getDymoManager().loadFromStore();
    } else if (this.selectedDymo) {
      await this.player.getDymoManager().loadIntoStore(this.selectedDymo.saveFile);
    }
    this.initOrUpdateLoader('Loading context...');
    this.location = await this.geolocation.getCurrentPosition();
    console.log("LOCATION", this.location)
    if (this.location) {
      await this.initSensorsAndUI();
      //this.sliders.forEach(s => {s.uiValue = _.random(1000); s.update()});
      await this.generateVersion();
      //await this.generateVersion2();
      /*console.log("preloading")
      await this.preloadFirstTwoSections();
      console.log("preloaded")*/
      this.hideLoading();
    } else {
      this.initOrUpdateLoader('Failed to load context');
    }
  }

  private async generateVersion() {
    const amenities = await this.overpass.getShopsAndAmenitiesNearby(...this.location);
    const remoteness = 1-(Math.min(20, Math.sqrt(amenities.length))/20); //[0,400]=>[0,1]
    const currentWeather = await this.weather.getWeatherNearby(...this.location);
    const weather = currentWeather.weather[0];
    this.contextName = currentWeather.name + ", " + weather.description;
    this.contextIcon = "https://openweathermap.org/img/wn/"+weather.icon+".png";
    console.log(amenities, weather);
    const primary = remoteness < 0.3 ? 2
      : remoteness < 0.6 ? 1
      : remoteness < 0.85 ? 0
      : 3;
    const secondary = [800,801].indexOf(weather.id) >= 0 ? 2 //clear sky, few clouds
      : weather.main === "Clouds" ? 1 //scattered/broken/overcast clouds
      : ["Rain", "Drizzle"].indexOf(weather.main) >= 0 ? 0
      : 3; //atmosphere, thunderstorm, snow
    
    const MAX_INSTR_COUNT = 12;//in g1/g2/g3/g4
    const MAX_PLAYING = 12;
    const MIN_PLAYING = 4;
    const PRIMARY_PROPORTION = 0.5;
    const store = this.player.getDymoManager().getStore();
    await store.setParameter(null, uris.CONTEXT_URI+"remoteness", remoteness);
    await store.setParameter(null, uris.CONTEXT_URI+"vocals", primary);
    await store.setParameter(null, uris.CONTEXT_URI+"primarymaterial", primary);
    await store.setParameter(null, uris.CONTEXT_URI+"secondarymaterial", secondary);
    const timeOfDay = await store.findParameterValue(null, uris.CONTEXT_URI+"timeofday");
    const activity = 1-(2*Math.abs(timeOfDay-0.5)); //range [0,1]
    const partCount = _.round((activity*(MAX_PLAYING-MIN_PLAYING))+MIN_PLAYING); //range [min,max]
    const primaryCount = _.round(partCount*PRIMARY_PROPORTION);
    const secondaryCount = _.round(partCount*(1-PRIMARY_PROPORTION));
    const primaries = _.sampleSize(_.range(MAX_INSTR_COUNT), primaryCount);
    const remaining = primary === secondary ?
      _.difference(_.range(MAX_INSTR_COUNT), primaries) : _.range(MAX_INSTR_COUNT);
    const secondaries = _.sampleSize(remaining, secondaryCount);
    await store.setParameter(null, uris.CONTEXT_URI+"primaryinstruments", primaries);
    await store.setParameter(null, uris.CONTEXT_URI+"secondaryinstruments", secondaries);
    console.log("VOCALS", await store.findParameterValue(null, uris.CONTEXT_URI+"vocals"));
    console.log("PRIMARY", await store.findParameterValue(null, uris.CONTEXT_URI+"primarymaterial"));
    console.log("SECONDARY", await store.findParameterValue(null, uris.CONTEXT_URI+"secondarymaterial"));
    console.log("PARTS", partCount);
    console.log("PRIM_INST", await store.findParameterValue(null, uris.CONTEXT_URI+"primaryinstruments"));
    console.log("SEC_INST", await store.findParameterValue(null, uris.CONTEXT_URI+"secondaryinstruments"));
  }
  
  private async generateVersion2() {
    const INTROS = 13;
    const ATMOS = 8;
    const DRUMS = 12;
    const PERC = 8;
    const SYNTHS = 8;
    const store = this.player.getDymoManager().getStore();
    const intro = (await store.findParts(uris.CONTEXT_URI+"machine"))[0];
    const introCount = (await store.findParts(intro)).length;
    await store.setParameter(null, uris.CONTEXT_URI+"intro", _.random(introCount-1));
    await store.setParameter(null, uris.CONTEXT_URI+"drums",
      _.sampleSize(_.range(0, DRUMS), _.random(1, 2)));
    await store.setParameter(null, uris.CONTEXT_URI+"sound", _.random(ATMOS-1));
    await store.setParameter(null, uris.CONTEXT_URI+"perc",
      _.sampleSize(_.range(0, PERC), _.random(0, 1)));
    await store.setParameter(null, uris.CONTEXT_URI+"synths",
      _.sampleSize(_.range(0, SYNTHS), 1));
    console.log("INTRO", await store.findParameterValue(null, uris.CONTEXT_URI+"intro"));
    console.log("DRUMS", await store.findParameterValue(null, uris.CONTEXT_URI+"drums"));
    console.log("SOUND", await store.findParameterValue(null, uris.CONTEXT_URI+"sound"));
    console.log("PERC", await store.findParameterValue(null, uris.CONTEXT_URI+"perc"));
    console.log("SYNTH", await store.findParameterValue(null, uris.CONTEXT_URI+"synths"));
  }

  private async preloadFirstTwoSections() {
    const store = this.player.getDymoManager().getStore();
    const sections = (await store.findParts((await store.findTopDymos())[0])).slice(0,2);
    const dymos = _.flatten(await Promise.all(sections.map(s => store.findAllObjectsInHierarchy(s))));
    const audio = (await Promise.all(dymos.map(d => store.getSourcePath(d)))).filter(s => s);
    console.log(audio)
    await this.player.getAudioBank().preloadBuffers(audio);
  }

  private async initSensorsAndUI() {
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
      await Promise.all(this.player.getDymoManager().getSensorControls().map(control => {
        if (watcherLookup.has(control.getType())) {
          this.sensors.push(control);
          control.setSensor({
            watch: watcherLookup.get(control.getType())
          });
          return control.startUpdate();
        }
      }));
    }
    //init ui
    this.player.getDymoManager().getUIControls().forEach(control => {
      switch (control.getType()) {
        case uris.SLIDER: this.sliders.push(new InnoyicSliderWrapper(control)); break;
        case uris.TOGGLE: this.toggles.push(control); break;
        case uris.BUTTON: this.buttons.push(control); break;
      }
    });
    this.player.getDymoManager().getWeatherControls().forEach(control => {
      control.setLocation(...this.location);
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

  private hideLoading(): void {
    if (this.loading) (await this.loading).dismiss();
    this.loading = null;
  }

  private async initOrUpdateLoader(content: string) {
    if (!this.loading) {
      this.loading = this.loadingController.create({
        message: content,
        cssClass: 'transp-loading'
      });
      (await this.loading).present();
    } else {
      (await this.loading).message = content;
    }
  }
  
  async showInfo() {
    const modal = await this.modalController.create({
      component: InfoComponent,
      cssClass: 'transp-modal',
    });
    return await modal.present();
  }

}
