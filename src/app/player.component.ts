import { Component } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';

import { DymoManager, UIControl, uris } from 'dymo-core';

import { ConfigService } from './config.service';
import { InnoyicSliderWrapper } from './innoyic-slider-wrapper';

interface DymoConfig {
  name: string,
  dymoUri: string,
  renderingUri: string
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
  private controls: any[];
  private SLIDER = uris.SLIDER;

  manager: DymoManager;
  selectedDymo: DymoConfig;

  constructor(private loadingController: LoadingController,
    private configService: ConfigService) { }

  ngOnInit(): void {
    this.configService.getConfig()
      .then(config => {
        this.config = config;
        this.selectedDymo = config['dymos'][0];
        this.dymoSelected();
      });
  }

  dymoSelected(): void {
    if (this.selectedDymo) {
      this.resetUI();
      this.loadingDymo = true;
      this.updateLoading();
      this.manager = new DymoManager(undefined, null, null, null, 'assets/impulse_rev.wav');
      this.manager.init('https://semantic-player.github.io/dymo-core/ontologies/')
        .then(() => this.manager.loadDymoAndRendering(this.selectedDymo.dymoUri, this.selectedDymo.renderingUri))
        .then(l => {
          this.loadingDymo = false;
          this.controls = l.controls.map(c =>
            c.getType() === this.SLIDER ? new InnoyicSliderWrapper(<UIControl>c) : c);
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
