import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';

export interface Acceleration {
  x: number;
  y: number;
  z: number;
}

export interface AccelerationWatcher {
  x: Observable<number>;
  y: Observable<number>;
  z: Observable<number>;
}

export function createDeviceMotionAccelerationObservable(
  windowObj: Window
): Observable<Acceleration> {
  // This isn't really idiomatic angular (the use of browser specific events and window object)
  return Observable.fromEvent(
    windowObj,
    'devicemotion',
    (ev: DeviceMotionEvent) => ({
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
    x: acceleration.map(acceleration => acceleration.x),
    y: acceleration.map(acceleration => acceleration.y),
    z: acceleration.map(acceleration => acceleration.z)
  };
}

export function createStubAccelerationObservable(): Observable<Acceleration> {
  return Observable.interval(300).map(() => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random()
  })).share();
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
}