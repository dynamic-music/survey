import { UIControl } from 'dymo-core';

export enum AreaControlType { X, Y, A }

export class AreaControl {

  public imageUrl: string;
  private controls: UIControl[] = [];
  private mouseDowns: boolean[] = [];
  private canvas: HTMLCanvasElement;
  private currentCanvasValues: number[] = [];
  private UPDATE_FUNCS = [
    this.updateMousePosition.bind(this),()=>null, this.updateMouseAngle.bind(this)];
  private previousY: number;
  
  hasControl(type: AreaControlType) {
    return this.controls[type] != null;
  }
  
  setControl(type: AreaControlType, control: UIControl) {
    if (this.controls[type] == null) {
      this.controls[type] = control;
      this.controls[type].getUIValueObserver()
        .subscribe(v => this.updateControl(type, v));
      return true;
    }
  }
  
  onTap(event: MouseEvent) {
    const button = event.ctrlKey ? 2 : event.button;
    if (event.type === "mousedown") {
      this.mouseDowns[button] = true;
      console.log(button, this.mouseDowns[button], event)
      this.UPDATE_FUNCS[button](event);
      this.previousY = event.offsetX;
    } else if (event.type === "mouseup") {
      this.mouseDowns[button] = false;
      this.previousY = null;
    } else if (event.type === "mousemove" && this.mouseDowns[button]) {
      this.UPDATE_FUNCS[button](event);
    }
  }
  
  private updateMousePosition(event: MouseEvent) {
    this.canvas = <HTMLCanvasElement>event.srcElement;
    this.updateCanvas([AreaControlType.X, AreaControlType.Y],
      [event.offsetX, event.offsetY]);
    this.updateControls([AreaControlType.X, AreaControlType.Y],
      [this.currentCanvasValues[AreaControlType.X]/this.canvas.width,
      this.currentCanvasValues[AreaControlType.Y]/this.canvas.height]);
  }
  
  private updateMouseAngle(event: MouseEvent) {
    this.canvas = <HTMLCanvasElement>event.srcElement;
    const deltaY = this.previousY != null ? event.offsetY - this.previousY : 0;
    const prevAngle = this.currentCanvasValues[AreaControlType.A];
    const newAngle = (((((prevAngle ? prevAngle : 0)
      + (deltaY/this.canvas.height*360*2))) % 360) + 360) % 360;//js modulo ;(
    this.previousY = event.offsetY;
    console.log(newAngle)
    this.updateCanvas([AreaControlType.A], [newAngle]);
    this.updateControls([AreaControlType.A], [(newAngle+90)/360]);
  }
  
  private updateControl(type: AreaControlType, value: number) {
    if (this.canvas)
      this.updateCanvas([type], [
        type === AreaControlType.X ? value*this.canvas.width
        : type === AreaControlType.Y ? value*this.canvas.height
        : (value*360)-90]);
  }
  
  private updateCanvas(types: AreaControlType[], values: number[]) {
    types.forEach((t,i) => this.currentCanvasValues[t] = values[i]);
    const x = this.currentCanvasValues[AreaControlType.X];
    const y = this.currentCanvasValues[AreaControlType.Y];
    const a = this.currentCanvasValues[AreaControlType.A];
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.strokeStyle = 'red';
    context.lineWidth = 4;
    context.fillStyle = 'red';
    context.beginPath();
    context.ellipse(x, y, 10, 10, 0, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x+20*Math.cos(a/180*Math.PI), y+20*Math.sin(a/180*Math.PI));
    context.stroke();
  }
  
  setImage(imageUrl: string) {
    this.imageUrl = imageUrl;
  }

  getName() {
    return this.controls.map(c => c.getName()).join("/");
  }

  getType() {
    return this.controls.map(c => c.getType()).join("/");
  }

  private updateControls(types: AreaControlType[], values: number[]) {
    types.forEach((t,i) => this.controls[t].uiValue = values[i]);
    types.forEach(t => this.controls[t].update());
  }

}