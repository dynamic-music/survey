import { UIControl } from 'dymo-core';

export class InnoyicSliderWrapper {

  private SLIDER_MAX = 1000;

  public uiValue;

  constructor(private uiControl: UIControl) {
    uiControl.getUIValueObserver().subscribe(v => {this.uiValue = this.SLIDER_MAX*v});
  }

  getName() {
    return this.uiControl.getName();
  }

  getType() {
    return this.uiControl.getType();
  }

  update() {
    this.uiControl.uiValue = this.uiValue/this.SLIDER_MAX;
    this.uiControl.update();
  }

}