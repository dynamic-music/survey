import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { DeviceMotion } from '@ionic-native/device-motion';

export interface Acceleration {
  x: number;
  y: number;
  z: number;
}

@Injectable()
export class AccelerationService {
  public watchX: Observable<number>;
  public watchY: Observable<number>;
  public watchZ: Observable<number>;

  constructor(private motion: DeviceMotion) {
    this.watchX = this.motion.watchAcceleration().pipe(map((a:any) => a.x));
    //this.watchY = this.motion.watchAcceleration().map(a => a.y);
    //this.watchZ = this.motion.watchAcceleration().map(a => a.z);
  }
}

/*export interface AccelerationWatcher {
  x: Observable<number>;
  y: Observable<number>;
  z: Observable<number>;
}

export function createDeviceMotionAccelerationObservable(
  windowObj: Window
): Observable<Acceleration> {
  // This isn't really idiomatic angular (the use of browser specific events and window object)
  return fromEvent(
    windowObj,
    'devicemotion',
    ev => ({
      x: normalizeAcceleration(ev.accelerationIncludingGravity.x),
      y: normalizeAcceleration(ev.accelerationIncludingGravity.y),
      z: normalizeAcceleration(ev.accelerationIncludingGravity.z),
    })).share();
}

// normalizes acceleration to interval [0,1]
function normalizeAcceleration(acceleration: number): number {
  return (acceleration / 9.81 + 1) / 2;
}

export function createAccelerationWatcherFrom(
  acceleration: Observable<Acceleration>
): AccelerationWatcher {
  return {
    x: acceleration.pipe(map(acceleration => acceleration.x)),
    y: acceleration.pipe(map(acceleration => acceleration.y)),
    z: acceleration.pipe(map(acceleration => acceleration.z))
  };
}

export function createStubAccelerationObservable(): Observable<Acceleration> {
  return interval(300).pipe(map(() => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random()
  })));
}

@Injectable()
export class AccelerationService {
  public watchX: Observable<number>;
  public watchY: Observable<number>;
  public watchZ: Observable<number>;

  constructor({x, y, z}: AccelerationWatcher) {
    this.watchX = x;
    this.watchY = y;
    this.watchZ = z;
  }
}

export function toAccelerationServiceFactoryWith(watcher: AccelerationWatcher) {
  return () => new AccelerationService(watcher);
}*/