import { UIControl } from 'dymo-core';

export class AreaControl {

  private xControl: UIControl;
  private yControl: UIControl;
  public uiValue;
  public imageUrl: string;
  private mouseDown = false;
  private canvas: HTMLCanvasElement;
  private currentX: number;
  private currentY: number;
  
  hasXControl() {
    return this.xControl != null;
  }
  
  hasYControl() {
    return this.yControl != null;
  }
  
  setXControl(control: UIControl) {
    if (this.xControl == null) {
      this.xControl = control;
      this.xControl.getUIValueObserver().subscribe(x => this.updateX(x));
      return true;
    }
  }
  
  setYControl(control: UIControl) {
    if (this.yControl == null) {
      this.yControl = control;
      this.yControl.getUIValueObserver().subscribe(y => this.updateY(y));
      return true;
    }
  }
  
  onTap(event: MouseEvent) {
    if (event.type === "mousedown") {
      this.mouseDown = true;
      this.updateMousePosition(event);
    } else if (event.type === "mouseup") {
      this.mouseDown = false;
    } else if (event.type === "mousemove" && this.mouseDown) {
      this.mouseDown = true;
      this.updateMousePosition(event);
    }
  }
  
  private updateMousePosition(event: MouseEvent) {
    this.canvas = <HTMLCanvasElement>event.srcElement;
    this.updateCanvas(event.offsetX, event.offsetY);
  }
  
  private updateX(x: number) {
    if (this.canvas)
      this.updateCanvas(x*this.canvas.width, this.currentY);
  }
  
  private updateY(y: number) {
    if (this.canvas)
      this.updateCanvas(this.currentX, y*this.canvas.height);
  }
  
  private updateCanvas(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = 'red';
    context.beginPath();
    context.ellipse(x, y, 10, 10, 0, 0, 2 * Math.PI);
    context.fill();
    this.update(x/this.canvas.width, y/this.canvas.height);
  }
  
  setImage(imageUrl: string) {
    this.imageUrl = imageUrl;
  }

  getName() {
    return this.xControl.getName() + "/" + this.yControl.getName();
  }

  getType() {
    return this.xControl.getType() + "/" + this.yControl.getType();
  }

  private update(x: number, y: number) {
    console.log(x, y)
    this.xControl.uiValue = x;
    this.yControl.uiValue = y;
    this.xControl.update();
    this.yControl.update();
  }

}