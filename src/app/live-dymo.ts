import { DymoGenerator, uris, forAll } from 'dymo-core';

export class LiveDymo {

  private DIR = 'assets/dymos/live/';

  constructor(private dymoGen: DymoGenerator) {}

  async create3() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    const bass = await this.dymoGen.addDymo(music, null, uris.DISJUNCTION);
    const drums = await this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 10-Audio.m4a');
    await this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 14-Audio.m4a');
    this.map(uris.SLIDER, drums, "Amplitude");
  }

  async create7() {
    const drums = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 1-Audio.m4a');
    const drums2 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 2-Audio.m4a');
    const drums3 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 3-Audio.m4a');
    this.map(uris.ACCELEROMETER_X, drums1, "DurationRatio");
    this.map(uris.SLIDER, drums1, "DurationRatio");
    this.map(uris.ACCELEROMETER_Y, drums2, "DurationRatio");
    this.map(uris.SLIDER, drums2, "DurationRatio");
    this.map(uris.ACCELEROMETER_Z, drums3, "DurationRatio");
    this.map(uris.SLIDER, drums3, "DurationRatio");
  }

  async create6() {
    const drums = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 1-Audio.m4a');
    const drums2 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 2-Audio.m4a');
    const drums3 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 3-Audio.m4a');
    this.map(uris.ACCELEROMETER_X, drums1, "Play", "(c>0.8?1:0)");
    this.map(uris.ACCELEROMETER_Y, drums2, "Play", "(c>0.8?1:0)");
    this.map(uris.ACCELEROMETER_Z, drums3, "Play", "(c>0.8?1:0)");
  }

  async create5() {
    const music = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const part1 = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const part2 = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const drums = await this.dymoGen.addDymo(part1, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(part1, this.DIR+'Bass/All loops 10-Audio.m4a');
    await this.dymoGen.getStore().addPart(part2, drums);
    await this.dymoGen.addDymo(part2, this.DIR+'Bass/All loops 14-Audio.m4a');
    this.map(uris.COMPASS_HEADING, drums, "Amplitude", "c");
    this.map(uris.SLIDER, drums, "Amplitude");
  }

  async createN() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    const drums = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 17-Audio.m4a');
    const drums2 = await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 18-Audio.m4a');
    const bass = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const bass1 = await this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 13-Audio.m4a');
    const bass2 = await this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 14-Audio.m4a');
    const synth = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const synth1 = await this.dymoGen.addDymo(synth, this.DIR+'Synth/synth1.m4a');
    const synth2 = await this.dymoGen.addDymo(synth, this.DIR+'Synth/All loops 3-Audio.m4a');

    this.map(uris.ACCELEROMETER_X, drums1, "Amplitude");
    this.map(uris.ACCELEROMETER_X, drums2, "Amplitude", "1-c");
    this.map(uris.ACCELEROMETER_Y, bass1, "Amplitude");
    this.map(uris.ACCELEROMETER_Y, bass2, "Amplitude", "1-c");
    this.map(uris.ACCELEROMETER_Z, synth1, "Amplitude");
    this.map(uris.ACCELEROMETER_Z, synth2, "Amplitude", "1-c");
    this.map(uris.ACCELEROMETER_Z, music, "Reverb", "c/3");
  }

  async create() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    const drums = await this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 17-Audio.m4a');
    const bass = await this.dymoGen.addDymo(music, this.DIR+'Bass/All loops 10-Audio.m4a');
    const synth = await this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 5-Audio.m4a');
    const space = await this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 4-Audio.m4a');
    await this.dymoGen.addConstraint(
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

  async create4() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    await this.dymoGen.setDymoParameter(music, uris.LOOP, 1);
    const drums = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 18-Audio.m4a');
    const synth = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    await this.dymoGen.addDymo(synth, this.DIR+'Synth/synth1.m4a');

    this.map(uris.SLIDER, drums1, "Amplitude");
    this.map(uris.SLIDER, drums, "Amplitude");
    this.map(uris.SLIDER, music, "Amplitude");
  }

  private map(controlType: string, dymo: string, param: string, formula: string = "c", freq?: number) {
    this.constrain(controlType, dymo, param, "=="+formula, freq);
  }

  private async constrain(controlType: string, dymo: string, param: string, formula: string, freq = 200) {
    const control = await this.dymoGen.addControl(undefined, controlType);
    await this.dymoGen.getStore().setControlParam(control, uris.AUTO_CONTROL_FREQUENCY, freq);
    await this.dymoGen.addConstraint(
      forAll("d").in(dymo).forAll("c").in(control).assert(param+"(d)"+formula));
  }

}