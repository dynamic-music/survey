import * as _ from 'lodash';
import { DymoGenerator, uris, forAll } from 'dymo-core';

export class LiveDymo {

  private DIR = 'assets/dymos/live/';

  constructor(private dymoGen: DymoGenerator) {}

  create(): Promise<any> {
    return this.createSpaceDemo();
  }

  async createLoopTimestretchDemo() {
    const dymo = await this.dymoGen.addDymo(undefined, "assets/dymos/loop/loop.wav");
    await this.dymoGen.setDymoParameter(dymo, uris.LOOP, 1);
    await this.dymoGen.setDymoParameter(dymo, uris.TIME_STRETCH_RATIO, 1);
    await this.addSlider(dymo, "TimeStretchRatio", "stretch", "2*c");
  }

  async createMathDemo() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    await this.addSlider(music, "Amplitude", "sin(a)", "c*2-1");
    await this.addSlider(music, "Amplitude", "a", "Math.sin(c*6)");
  }

  async createSpaceDemo() {
    const DIR = 'assets/dymos/100/';
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    //await this.dymoGen.setDymoParameter(music, uris.LOOP, 1);
    await Promise.all(_.sampleSize(_.range(100), 5).map(async n => {
      const d = await this.dymoGen.addDymo(music, DIR+n+".wav");
      await this.dymoGen.setDymoParameter(d, uris.LOOP, 1);
      await this.dymoGen.setDymoParameter(d, uris.HEIGHT, 0.1);
      //await this.addSlider(d, "Pan", n+"", "(c-0.5)*2");
      await this.map(uris.BROWNIAN, d, "Amplitude", "c/4", 300);
      await this.map(uris.BROWNIAN, d, "Pan", "(c-0.5)/2", 300);
      await this.map(uris.RANDOM, d, "DurationRatio", "c+0.5", 800);
      await this.map(uris.BROWNIAN, d, "PlaybackRate", "c+0.5", 500);
      await this.map(uris.RANDOM, d, "Reverb", "(c<0.2?0.1-(c-0.1):0)", 300); //"c/4", 300);
    }));
    const d = await this.dymoGen.addDymo(music, "assets/dymos/flo/808 Bass Lex.wav");
    await this.dymoGen.setDymoParameter(d, uris.LOOP, 1);
    await this.dymoGen.setDymoParameter(d, uris.DURATION_RATIO, Math.random()/5+0.1);
    await this.dymoGen.setDymoParameter(d, uris.AMPLITUDE, 0.5);

    /*
    await this.dymoGen.setDymoParameter(music, uris.LOOP, 1);
    const drums = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 18-Audio.m4a');
    const synth = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    await this.dymoGen.addDymo(synth, this.DIR+'Synth/synth1.m4a');
    await this.dymoGen.setDymoParameter(music, uris.AMPLITUDE, 1);
    await this.dymoGen.setDymoParameter(drums, uris.AMPLITUDE, 1);
    await this.dymoGen.setDymoParameter(drums1, uris.AMPLITUDE, 1);

    await this.addSlider(drums1, "Amplitude", "drums1");
    await this.addSlider(drums, "Amplitude", "drums");
    await this.addSlider(music, "Amplitude", "music");*/
  }

  async createDisjunctionDemo() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    const bass = await this.dymoGen.addDymo(music, null, uris.DISJUNCTION);
    const drums = await this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 10-Audio.m4a');
    await this.dymoGen.addDymo(bass, this.DIR+'Bass/All loops 14-Audio.m4a');
    await this.addSlider(drums, "Amplitude");
  }

  async createSensorDemo() {
    const drums = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 1-Audio.m4a');
    const drums2 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 2-Audio.m4a');
    const drums3 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 3-Audio.m4a');
    await this.map(uris.ACCELEROMETER_X, drums1, "DurationRatio");
    await this.addSlider(drums1, "DurationRatio");
    await this.map(uris.ACCELEROMETER_Y, drums2, "DurationRatio");
    await this.addSlider(drums2, "DurationRatio");
    await this.map(uris.ACCELEROMETER_Z, drums3, "DurationRatio");
    await this.addSlider(drums3, "DurationRatio");
  }

  async createTriggerDemo() {
    const drums = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 1-Audio.m4a');
    const drums2 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 2-Audio.m4a');
    const drums3 = await this.dymoGen.addDymo(drums, this.DIR+'drm/drm 3-Audio.m4a');
    await this.map(uris.ACCELEROMETER_X, drums1, "Play", "(c>0.8?1:0)");
    await this.map(uris.ACCELEROMETER_Y, drums2, "Play", "(c>0.8?1:0)");
    await this.map(uris.ACCELEROMETER_Z, drums3, "Play", "(c>0.8?1:0)");
  }

  async createFadingDemo() {
    const music = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const part1 = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const part2 = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const drums = await this.dymoGen.addDymo(part1, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(part1, this.DIR+'Bass/All loops 10-Audio.m4a');
    await this.dymoGen.getStore().addPart(part2, drums);
    await this.dymoGen.addDymo(part2, this.DIR+'Bass/All loops 14-Audio.m4a');
    await this.map(uris.COMPASS_HEADING, drums, "Amplitude", "c");
    await this.addSlider(drums, "Amplitude");
  }

  async createFadingDemo2() {
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

    await this.map(uris.ACCELEROMETER_X, drums1, "Amplitude");
    await this.map(uris.ACCELEROMETER_X, drums2, "Amplitude", "1-c");
    await this.map(uris.ACCELEROMETER_Y, bass1, "Amplitude");
    await this.map(uris.ACCELEROMETER_Y, bass2, "Amplitude", "1-c");
    await this.map(uris.ACCELEROMETER_Z, synth1, "Amplitude");
    await this.map(uris.ACCELEROMETER_Z, synth2, "Amplitude", "1-c");
    await this.map(uris.ACCELEROMETER_Z, music, "Reverb", "c/3");
  }

  async createAmpSumDemo() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    await this.dymoGen.setDymoParameter(music, uris.LOOP, 1);
    const drums = await this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 17-Audio.m4a');
    const bass = await this.dymoGen.addDymo(music, this.DIR+'Bass/All loops 10-Audio.m4a');
    const synth = await this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 5-Audio.m4a');
    const space = await this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 4-Audio.m4a');
    await this.dymoGen.setDymoParameter(space, uris.AMPLITUDE, 0.1);
    await this.dymoGen.addConstraint(
      forAll("d").in(drums)
      .forAll("b").in(bass)
      .forAll("s").in(synth)
      .assert("1 == Amplitude(d) + Amplitude(b) + Amplitude(s)"));
    await this.map(uris.BROWNIAN, drums, "Amplitude", "c/2", 101);
    await this.map(uris.BROWNIAN, synth, "Amplitude", "c/2", 111);
    await this.addSlider(drums, "Amplitude", "drums");
    await this.addSlider(bass, "Amplitude", "bass ");
    await this.addSlider(synth, "Amplitude", "synth");
    await this.map(uris.BROWNIAN, space, "Pan", "(c-0.5)", 100);
    await this.map(uris.BROWNIAN, space, "Distance", "(c-0.5)", 100);
    await this.map(uris.BROWNIAN, space, "Height", "(c-0.5)", 100);
    await this.map(uris.RANDOM, space, "Reverb", "c*3", 100);
  }

  async createHierarchyDemo() {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    await this.dymoGen.setDymoParameter(music, uris.LOOP, 1);
    const drums = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    const drums1 = await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 17-Audio.m4a');
    await this.dymoGen.addDymo(drums, this.DIR+'Drums/All loops 18-Audio.m4a');
    const synth = await this.dymoGen.addDymo(music, null, uris.CONJUNCTION);
    await this.dymoGen.addDymo(synth, this.DIR+'Synth/synth1.m4a');
    await this.dymoGen.setDymoParameter(music, uris.AMPLITUDE, 1);
    await this.dymoGen.setDymoParameter(drums, uris.AMPLITUDE, 1);
    await this.dymoGen.setDymoParameter(drums1, uris.AMPLITUDE, 1);

    await this.addSlider(drums1, "Amplitude", "drums1");
    await this.addSlider(drums, "Amplitude", "drums");
    await this.addSlider(music, "Amplitude", "music");
  }

  private async addSlider(dymo: string, param: string, name?: string, formula: string = "c") {
    await this.constrain(uris.SLIDER, dymo, param, "=="+formula, 50, name);
  }

  private async map(controlType: string, dymo: string, param: string, formula: string = "c", freq?: number) {
    await this.constrain(controlType, dymo, param, "=="+formula, freq);
  }

  private async constrain(controlType: string, dymo: string, param: string, formula: string, freq = 200, controlName?: string) {
    const control = await this.dymoGen.addControl(controlName, controlType);
    await this.dymoGen.getStore().setControlParam(control, uris.AUTO_CONTROL_FREQUENCY, freq);
    await this.dymoGen.addConstraint(
      forAll("d").in(dymo).forAll("c").in(control).assert(param+"(d)"+formula));
  }

}