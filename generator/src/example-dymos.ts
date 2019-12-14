import * as fs from 'fs';
import * as _ from 'lodash';
import { DymoGenerator, forAll, uris } from 'dymo-core';
import { DymoWriter } from './dymo-writer';


new DymoWriter('src/assets/dymos/', 'src/assets/config.json').generateAndWriteDymos([
  {name: 'example', path: 'example/', func: createSimpleDymo},
  {name: 'constraints', path: 'constraints/', func: createConstraintsExample},
  {name: 'loop', path: 'loop/', func: createLoopTimestretchTest},
  {name: 'sensor', path: 'sensor/', func: createSensorExample},
  {name: 'deadhead', path: 'deadhead/', func: createDeadDymo}
]);


async function createSensorExample(dymoGen: DymoGenerator) {
  const dymo = await dymoGen.addDymo(undefined, 'loop.wav');
  await dymoGen.setDymoParameter(dymo, uris.LOOP, 1);
  await addSensorSliderConstraint(dymoGen, "Amp", uris.ACCELEROMETER_X, "Amplitude");
  await addSensorSliderConstraint(dymoGen, "Rate", uris.ACCELEROMETER_Y, "PlaybackRate");
  await addSensorSliderConstraint(dymoGen, "Verb", uris.ACCELEROMETER_Z, "Reverb");
}

async function createLoopTimestretchTest(dymoGen: DymoGenerator) {
  const dymo = await dymoGen.addDymo(undefined, 'loop.wav');
  await dymoGen.setDymoParameter(dymo, uris.LOOP, 1);
  let slider = await dymoGen.addControl("StretchRatio", uris.SLIDER);
  let toggle = await dymoGen.addControl("Loop", uris.TOGGLE);
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert("TimeStretchRatio(d) == 2*c"));
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(toggle).assert("Loop(d) == c"));
}

async function createSimpleDymo(dymoGen: DymoGenerator) {
  const dymo = await dymoGen.addDymo(undefined, 'creak.wav');
  await dymoGen.setDymoParameter(dymo, uris.LOOP, 1);
  let slider = await dymoGen.addControl("Rate", uris.SLIDER);
  let random = await dymoGen.addControl(null, uris.BROWNIAN);
  let toggle = await dymoGen.addControl("Play", uris.TOGGLE, undefined, 0);
  let button = await dymoGen.addControl("Play", uris.BUTTON);
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert("Amplitude(d) == c"));
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(random).assert("Amplitude(d) == c"));
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(random).assert("PlaybackRate(d) == c"));
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(toggle).assert("Play(d) == c"));
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(button).assert("Play(d) == c"));
}

async function createConstraintsExample(dymoGen: DymoGenerator) {
  await dymoGen.addDymo();
  let a = await dymoGen.addControl("a", uris.SLIDER);
  let b = await dymoGen.addControl("b", uris.SLIDER);
  await addConstraintSlider("1-a", {"a":a}, dymoGen);
  await addConstraintSlider("a+b", {"a":a,"b":b}, dymoGen);
  await addConstraintSlider("a-b", {"a":a,"b":b}, dymoGen);
  await addConstraintSlider("a*b", {"a":a,"b":b}, dymoGen);
  await addConstraintSlider("a/b", {"a":a,"b":b}, dymoGen);
  await addConstraintSlider("(a>b?a:b)", {"a":a,"b":b}, dymoGen, true);
  await addConstraintSlider("Math.sin(Math.PI*a)", {"a":a}, dymoGen, true);
}

async function createMixDymo(dymoGen: DymoGenerator) {
  let mixDymoUri = await dymoGen.addDymo(null, null, uris.CONJUNCTION, uris.CONTEXT_URI+"mixdymo");
  await dymoGen.setDymoParameter(mixDymoUri, uris.LOOP, 1);
  let fadeParam = await dymoGen.addCustomParameter(uris.CONTEXT_URI+"Fade", mixDymoUri);
  let tempoParam = await dymoGen.addCustomParameter(uris.CONTEXT_URI+"Tempo", mixDymoUri);
  await dymoGen.addDymo(mixDymoUri, null, uris.DISJUNCTION, uris.CONTEXT_URI+"dymo0");
  await dymoGen.addDymo(mixDymoUri, null, uris.DISJUNCTION, uris.CONTEXT_URI+"dymo00");
  await dymoGen.addConstraint(
    forAll("d").ofTypeWith(uris.DYMO, "LevelFeature(d) == 1")
      .forAll("f").in(fadeParam)
      .assert("Amplitude(d) == (1-f)*(1-IndexFeature(d)) + f*IndexFeature(d)"));
  await dymoGen.addConstraint(
    forAll("d").ofTypeWith(uris.DYMO, "LevelFeature(d) == 3")
      .forAll("t").in(tempoParam)
      .assert("TimeStretchRatio(d) == t/60*DurationFeature(d)"));
}

async function createDeadDymo(dymoGen: DymoGenerator) {
  const SCALE_FACTOR = 7;
  const mdsPath = 'generator/src/mfcc_mds_128*0.5sec_mds.json';
  let points: number[][] = JSON.parse(fs.readFileSync(mdsPath, 'utf8'));
  points = normalizeXY(<[number,number][]>points);
  points = points.map(p => p.map(v => SCALE_FACTOR*2*(v-0.5)));
  const audioFiles = fs.readdirSync('src/assets/dymos/deadhead/audio_trimmed/')
    .filter(f => f !== '.DS_Store');
  const parent = await dymoGen.addDymo(null, null, uris.CONJUNCTION);
  const parts = await Promise.all(audioFiles.map(a =>
    dymoGen.addDymo(parent, 'audio_trimmed/'+a)));
  parts.map(async (p,i) => {
    await dymoGen.setDymoParameter(p, uris.AMPLITUDE, 0.2);
    await dymoGen.setDymoParameter(p, uris.PAN, points[i][0]);
    await dymoGen.setDymoParameter(p, uris.DISTANCE, points[i][1]);
  });
  /*await addGlobalControlConstraint(dymoGen, 'Orientation', uris.SLIDER, 'ListenerOrientation');
  await addGlobalControlConstraint(dymoGen, 'X Position', uris.SLIDER, 'ListenerPositionX', '(c-0.5)*8');
  await addGlobalControlConstraint(dymoGen, 'Y Position', uris.SLIDER, 'ListenerPositionY', '(c-0.5)*8');*/
  await addGlobalControlConstraint(dymoGen, null, uris.AREA_X, 'ListenerPositionX', '(c-0.5)*'+(2*SCALE_FACTOR));
  await addGlobalControlConstraint(dymoGen, null, uris.AREA_Y, 'ListenerPositionY', '(0.5-c)*'+(2*SCALE_FACTOR));
  await addGlobalControlConstraint(dymoGen, null, uris.AREA_A, 'ListenerOrientation');
}

function normalizeXY(points: [number,number][]): [number,number][] {
  const minX = _.min(points.map(p => p[0]));
  const maxX = _.max(points.map(p => p[0]));
  const minY = _.min(points.map(p => p[1]));
  const maxY = _.max(points.map(p => p[1]));
  return points.map<[number,number]>(([x,y]) =>
    [(x-minX)/(maxX-minX), (y-minY)/(maxY-minY)]);
}

async function addConstraintSlider(expression: string, vars: {}, dymoGen: DymoGenerator, directed?: boolean) {
  let slider = await dymoGen.addControl(expression, uris.SLIDER);
  let constraint = forAll("c").in(slider);
  Object.keys(vars).forEach(k => constraint = constraint.forAll(k).in(vars[k]));
  await dymoGen.addConstraint(constraint.assert("c == "+expression, directed));
}

async function addSensorSliderConstraint(dymoGen: DymoGenerator, name: string, sensorType: string, param: string) {
  addSliderConstraint(dymoGen, name, param);
  let sensor = await dymoGen.addControl(undefined, sensorType);
  return dymoGen.addConstraint(getControlParamConstraint(sensor, param));
}

async function addGlobalControlConstraint(dymoGen: DymoGenerator, name: string,
    type: string, param: string, expression = "c") {
  let slider = await dymoGen.addControl(name, type);
  return dymoGen.addConstraint(forAll("c").in(slider).assert(param+"() == "+expression));
}

async function addSliderConstraint(dymoGen: DymoGenerator, name: string, param: string) {
  let slider = await dymoGen.addControl(name, uris.SLIDER);
  return dymoGen.addConstraint(getControlParamConstraint(slider, param));
}

function getControlParamConstraint(control: string, param: string) {
  return forAll("d").ofType(uris.DYMO).forAll("c").in(control)
    .assert(param+"(d) == c");
}
