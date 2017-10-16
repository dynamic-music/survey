import { Component, Inject } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';

import { DymoManager, GlobalVars, UIControl, uris } from 'dymo-core';

import { ConfigService } from './config.service';
import { FetchService } from './fetch.service';
import { InnoyicSliderWrapper } from './innoyic-slider-wrapper';

import { Acceleration } from './app.module';
import { Observable } from 'rxjs/Observable';

interface DymoConfig {
  name: string,
  saveFile: string
}

@Component({
  selector: 'semantic-player',
  templateUrl: 'player.component.html'
})
export class PlayerComponent {

  private config: Object = {};
  private showSensorData: boolean;
  private loadingDymo: boolean;
  private loading: Loading;
  private sliders: InnoyicSliderWrapper[];
  private toggles: UIControl[];
  private buttons: UIControl[];

  manager: DymoManager;
  selectedDymo: DymoConfig;

  constructor(private loadingController: LoadingController,
    private configService: ConfigService,
    private fetcher: FetchService,
    @Inject('AccelerationObservable') private acceleration: Observable<Acceleration>
  ) { }

  ngOnInit(): void {
    this.configService.getConfig()
      .then(config => {
        this.config = config;
        this.selectedDymo = config['dymos'][3];
        this.dymoSelected();
      });
  }

  dymoSelected(): void {
    if (this.selectedDymo) {
      this.resetUI();
      this.loadingDymo = true;
      this.updateLoading();
      GlobalVars.LOGGING_ON = true;
      this.manager = new DymoManager(undefined, null, null, null, 'assets/impulse_rev.wav', this.fetcher);
      this.manager.init('https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/')
        .then(() => this.manager.loadIntoStore(this.selectedDymo.saveFile))
        .then(l => {
          this.loadingDymo = false;
          this.sliders = l.controls.filter(c => c.getType() === uris.SLIDER)
            .map(c => new InnoyicSliderWrapper(<UIControl>c));
          this.toggles = <UIControl[]>l.controls.filter(c => c.getType() === uris.TOGGLE);
          this.buttons = <UIControl[]>l.controls.filter(c => c.getType() === uris.BUTTON);
          const sensors = this.manager.getSensorControls() as any[]; // TODO SensorControl
          const x = sensors.filter(sensor => sensor.getType() === uris.ACCELEROMETER_X)[0]; // check exists
          const y = sensors.filter(sensor => sensor.getType() === uris.ACCELEROMETER_Y)[0]; // check exists
          const z = sensors.filter(sensor => sensor.getType() === uris.ACCELEROMETER_Z)[0]; // check exists

          x.setSensor({
            watch: this.acceleration.map(val => val.x)
          });
          y.setSensor({
            watch: this.acceleration.map(val => val.y)
          });
          z.setSensor({
            watch: this.acceleration.map(val => val.z)
          });

          this.updateLoading();
          x.startUpdate();
        });
    }
  }

  resetUI(): void {
    /*if ($scope.rendering) {
      $scope.rendering.stop();
    }
    $scope.sensorControls = {};
    $scope.uiControls = {};
    $scope.manager;*/
  }

  toggleSensorData(): void {
    this.showSensorData = !this.showSensorData;
  }

  updateLoading(): void {
    if (this.loadingDymo) {
      this.initOrUpdateLoader('Loading dymo...');
    } else {
      this.loading.dismissAll();
      this.loading = null;
    }
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
