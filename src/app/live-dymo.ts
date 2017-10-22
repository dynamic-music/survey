import { DymoGenerator, uris, forAll } from 'dymo-core';

export class LiveDymo {

  private DIR = 'assets/dymos/live/';

  constructor(private dymoGen: DymoGenerator) {}

  create(): string {
    let music = this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    let drums = this.dymoGen.addDymo(music, this.DIR+'Drums/All loops 16-Audio.m4a');
    let bass = this.dymoGen.addDymo(music, this.DIR+'Bass/All loops 9-Audio.m4a');
    let synth = this.dymoGen.addDymo(music, this.DIR+'Synth/All loops 3-Audio.m4a');
    let rendering = this.dymoGen.addRendering(undefined, music);
    this.map(uris.ACCELEROMETER_X, drums, "Amplitude");
    this.map(uris.ACCELEROMETER_Y, bass, "Amplitude");
    this.map(uris.ACCELEROMETER_Z, synth, "Amplitude");
    this.map(uris.ACCELEROMETER_Z, synth, "Reverb", true);
    this.map(uris.ACCELEROMETER_Z, bass, "Reverb");
    return rendering;
  }

  private map(sensorType: string, dymo: string, param: string, invert?: boolean) {
    let slider = this.dymoGen.addControl(null, uris.SLIDER);
    this.dymoGen.addConstraint(
      forAll("d").in(dymo).forAll("c").in(slider).assert(param+"(d) == c"));

    let formula = invert ? "(d) == 1-((c+10)/20)" : "(d) == (c+10)/20";
    let sensor = this.dymoGen.addControl(undefined, sensorType);
    this.dymoGen.addConstraint(
      forAll("d").in(dymo).forAll("c").in(sensor).assert(param+formula));
  }
}