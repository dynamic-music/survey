import { Component } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';

import { DymoManager, GlobalVars, UIControl, uris } from 'dymo-core';

import { ConfigService } from './config.service';
import { InnoyicSliderWrapper } from './innoyic-slider-wrapper';

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
    private configService: ConfigService) { }

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
      this.manager = new DymoManager(undefined, null, null, null, 'assets/impulse_rev.wav');
      this.manager.init('https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/')
        .then(() => this.manager.loadIntoStore(this.selectedDymo.saveFile))
        .then(l => {
          this.loadingDymo = false;
          this.sliders = l.controls.filter(c => c.getType() === uris.SLIDER)
            .map(c => new InnoyicSliderWrapper(<UIControl>c));
          this.toggles = <UIControl[]>l.controls.filter(c => c.getType() === uris.TOGGLE);
          this.buttons = <UIControl[]>l.controls.filter(c => c.getType() === uris.BUTTON);
          this.updateLoading();
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
