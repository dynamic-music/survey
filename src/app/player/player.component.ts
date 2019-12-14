import { Component, HostListener } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { DymoPlayer } from 'dymo-player';
import { UIControl, SensorControl, uris, DymoGenerator } from 'dymo-core';

import { ConfigService, PlayerConfig, DymoConfig } from '../services/config.service';
import { FetchService } from '../services/fetch.service';
import { InnoyicSliderWrapper } from '../innoyic-slider-wrapper';
import { AccelerationService } from '../sensors/acceleration.service';
import { OrientationService } from '../sensors/orientation.service';
import { GeolocationService } from '../sensors/geolocation.service';
import { OverpassService } from '../services/overpass.service';

import { LiveDymo } from '../live-dymo';

import * as _ from 'lodash';

@Component({
  selector: 'semantic-player',
  templateUrl: 'player.component.html'
})
export class PlayerComponent {

  public config: PlayerConfig = {};
  public showSensorData: boolean;
  private loading: HTMLIonLoadingElement;
  private sensors: SensorControl[];
  private sliders: InnoyicSliderWrapper[];
  private toggles: UIControl[];
  private buttons: UIControl[];
  private performanceInfo: string;
  private numPlayingDymos: number;
  private numLoadedBuffers: number;
  private location: [number, number];

  player: DymoPlayer;
  selectedDymo: DymoConfig;

  constructor(private platform: Platform,
    private loadingController: LoadingController,
    private configService: ConfigService,
    private fetcher: FetchService,
    private acceleration: AccelerationService,
    private orientation: OrientationService,
    private geolocation: GeolocationService,
    private overpass: OverpassService
  ) { }

  async ngOnInit() {
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
  
  @HostListener('document:click', ['$event'])
  documentClick(_: MouseEvent) {
    this.player.isPlaying() ? this.player.stop() : this.player.play();
  }

  ////functions called from ui

  protected dymoSelected() {
    this.loadOrCreateDymo();
  }

  protected play() {
    this.player.play();
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
      scheduleAheadTime: 4,
      loadAheadTime: 8,
      fetcher: this.fetcher,
      ignoreInaudible: true,
      loggingOn: true,
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
    this.location = await this.geolocation.watchPosition.pipe(take(1)).toPromise();
    console.log("LOCATION", this.location)
    await this.initSensorsAndUI();
    //this.sliders.forEach(s => {s.uiValue = _.random(1000); s.update()});
    await this.generateVersion();
    //await this.generateVersion2();
    /*console.log("preloading")
    await this.preloadFirstTwoSections();
    console.log("preloaded")*/
    this.hideLoading();
  }

  private async generateVersion() {
    const amenities = await this.overpass.getShopsAndAmenitiesNearby(...this.location);
    console.log(amenities);
    const material = amenities.length > 50 ? 0 : amenities.length > 10 ? 1 : 2;
    const INSTRUMENT_COUNT = 17;
    const store = this.player.getDymoManager().getStore();
    console.log("set")
    await store.setParameter(null, uris.CONTEXT_URI+"vocals", material);
    await store.setParameter(null, uris.CONTEXT_URI+"material", material);
    const timeOfDay = await store.findParameterValue(null, uris.CONTEXT_URI+"timeofday");
    const activity = 1-(2*Math.abs(timeOfDay-0.5)); //range [0,1]
    const partCount = _.round((activity*9)+3); //range [3,12]
    console.log(timeOfDay, activity, partCount);
    await store.setParameter(null, uris.CONTEXT_URI+"instruments",
      _.sampleSize(_.range(INSTRUMENT_COUNT), partCount));
    console.log("VOCALS", await store.findParameterValue(null, uris.CONTEXT_URI+"vocals"));
    console.log("MATERIAL", await store.findParameterValue(null, uris.CONTEXT_URI+"material"));
    console.log("INSTRUMENTS", await store.findParameterValue(null, uris.CONTEXT_URI+"instruments"));
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
    this.loading.dismiss();
    this.loading = null;
  }

  private async initOrUpdateLoader(content: string) {
    if (!this.loading) {
      this.loading = await this.loadingController.create({
        message: content
      });
      this.loading.present();
    } else {
      this.loading.message = content;
    }
  }

}
