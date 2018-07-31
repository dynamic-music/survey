import { DymoGenerator, uris, forAll } from 'dymo-core';

export class LiveDymo {

  private DIR = 'assets/dymos/live/';

  constructor(private dymoGen: DymoGenerator) {}

  create3(): void {
    let music = this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    let bass = this.dymoGen.addDymo(music, null, uris.DISJUNCTION);
    let drums = this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 17-Audio.m4a');
    let bass1 = this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 10-Audio.m4a');
    let bass2 = this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 14-Audio.m4a');
    this.map(uris.SLIDER, drums, "Amplitude");
  }

  create7(): void {
    let drums = this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    let drums1 = this.dymoGen.addDymo(drums, this.DIR+'drm/drm 1-Audio.m4a');
    let drums2 = this.dymoGen.addDymo(drums, this.DIR+'drm/drm 2-Audio.m4a');
    let drums3 = this.dymoGen.addDymo(drums, this.DIR+'drm/drm 3-Audio.m4a');
    this.map(uris.ACCELEROMETER_X, drums1, "DurationRatio");
    this.map(uris.SLIDER, drums1, "DurationRatio");
    this.map(uris.ACCELEROMETER_Y, drums2, "DurationRatio");
    this.map(uris.SLIDER, drums2, "DurationRatio");
    this.map(uris.ACCELEROMETER_Z, drums3, "DurationRatio");
    this.map(uris.SLIDER, drums3, "DurationRatio");
  }

  create6(): void {
    let drums = this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    let drums1 = this.dymoGen.addDymo(drums, this.DIR+'drm/drm 1-Audio.m4a');
    let drums2 = this.dymoGen.addDymo(drums, this.DIR+'drm/drm 2-Audio.m4a');
    let drums3 = this.dymoGen.addDymo(drums, this.DIR+'drm/drm 3-Audio.m4a');
    this.map(uris.ACCELEROMETER_X, drums1, "Play", "(c>0.8?1:0)");
    this.map(uris.ACCELEROMETER_Y, drums2, "Play", "(c>0.8?1:0)");
    this.map(uris.ACCELEROMETER_Z, drums3, "Play", "(c>0.8?1:0)");
  }

  create5(): void {
    let music = this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    let part1 = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let part2 = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let drums = this.dymoGen.addDymo(part1, this.DIR+'Drums/All loops 17-Audio.m4a');
    let bass = this.dymoGen.addDymo(part1, this.DIR+'Bass/All loops 10-Audio.m4a');
    this.dymoGen.getStore().addPart(part2, drums);
    let bass2 = this.dymoGen.addDymo(part2, this.DIR+'Bass/All loops 14-Audio.m4a');
    this.map(uris.COMPASS_HEADING, drums, "Amplitude", "c");
    this.map(uris.SLIDER, drums, "Amplitude");
  }

  createN(): void {
    let music = this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    let drums = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let drums1 = this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 17-Audio.m4a');
    let drums2 = this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 18-Audio.m4a');
    let bass = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let bass1 = this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 13-Audio.m4a');
    let bass2 = this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 14-Audio.m4a');
    let synth = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let synth1 = this.dymoGen.addDymo(synth, this.DIR+'Synth/synth1.m4a');
    let synth2 = this.dymoGen.addDymo(synth, this.DIR+'Synth/All loops 3-Audio.m4a');

    this.map(uris.ACCELEROMETER_X, drums1, "Amplitude");
    this.map(uris.ACCELEROMETER_X, drums2, "Amplitude", "1-c");
    this.map(uris.ACCELEROMETER_Y, bass1, "Amplitude");
    this.map(uris.ACCELEROMETER_Y, bass2, "Amplitude", "1-c");
    this.map(uris.ACCELEROMETER_Z, synth1, "Amplitude");
    this.map(uris.ACCELEROMETER_Z, synth2, "Amplitude", "1-c");
    this.map(uris.ACCELEROMETER_Z, music, "Reverb", "c/3");
  }

  create(): void {
    let music = this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    let drums = this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 17-Audio.m4a');
    let bass = this.dymoGen.addDymo(music, this.DIR+'Bass/All loops 10-Audio.m4a');
    let synth = this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 5-Audio.m4a');
    let space = this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 4-Audio.m4a');
    this.dymoGen.addConstraint(
      forAll("d").in(drums)
      .forAll("b").in(bass)
      .forAll("s").in(synth)
      .assert("1 == Amplitude(d) + Amplitude(b) + Amplitude(s)"));
    this.map(uris.BROWNIAN, drums, "Amplitude", "c/2", 300);
    this.map(uris.BROWNIAN, synth, "Amplitude", "c/2", 300);
    this.map(uris.SLIDER, drums, "Amplitude");
    this.map(uris.SLIDER, bass, "Amplitude");
    this.map(uris.SLIDER, synth, "Amplitude");
    this.map(uris.BROWNIAN, space, "Pan", "(c-0.5)*10", 20);
    this.map(uris.BROWNIAN, space, "Distance", "(c-0.5)*10", 20);
    this.map(uris.BROWNIAN, space, "Height", "(c-0.5)*10", 20);
    this.map(uris.RANDOM, space, "Reverb", "c*3");
  }

  create4(): void {
    let music = this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    this.dymoGen.setDymoParameter(music, uris.LOOP, true);
    let drums = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let drums1 = this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 17-Audio.m4a');
    let drums2 = this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 18-Audio.m4a');
    let synth = this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    let synth1 = this.dymoGen.addDymo(synth, this.DIR+'Synth/synth1.m4a');

    this.map(uris.SLIDER, drums1, "Amplitude");
    this.map(uris.SLIDER, drums, "Amplitude");
    this.map(uris.SLIDER, music, "Amplitude");
  }

  private map(controlType: string, dymo: string, param: string, formula: string = "c", freq?: number) {
    this.constrain(controlType, dymo, param, "=="+formula, freq);
  }

  private constrain(controlType: string, dymo: string, param: string, formula: string, freq = 200) {
    let control = this.dymoGen.addControl(undefined, controlType);
    this.dymoGen.getStore().setControlParam(control, uris.AUTO_CONTROL_FREQUENCY, freq);
    this.dymoGen.addConstraint(
      forAll("d").in(dymo).forAll("c").in(control).assert(param+"(d)"+formula));
  }

}