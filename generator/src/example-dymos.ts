import { DymoGenerator, forAll, uris } from 'dymo-core';
import { DymoWriter, DymoDefinition } from './dymo-writer';


new DymoWriter('src/assets/dymos/', 'src/assets/config.json').generateAndWriteDymos([
  {name: 'example', path: 'example/', func: createSimpleDymo},
  {name: 'constraints', path: 'constraints/', func: createConstraintsExample},
  {name: 'loop', path: 'loop/', func: createLoopTimestretchTest},
  {name: 'sensor', path: 'sensor/', func: createSensorExample}
]);


async function createSensorExample(dymoGen: DymoGenerator) {
  const dymo = await dymoGen.addDymo(undefined, 'loop.wav');
  await dymoGen.setDymoParameter(dymo, uris.LOOP, 1);
  await addSensorSliderConstraint(dymoGen, "Amp", uris.ACCELEROMETER_X, "Amplitude");
  await addSensorSliderConstraint(dymoGen, "Rate", uris.ACCELEROMETER_Y, "PlaybackRate");
  await addSensorSliderConstraint(dymoGen, "Verb", uris.ACCELEROMETER_Z, "Reverb");
}

async function addSensorSliderConstraint(dymoGen: DymoGenerator, name: string, sensorType: string, param: string) {
  let slider = await dymoGen.addControl(name, uris.SLIDER);
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert(param+"(d) == c"));
  let sensor = await dymoGen.addControl(undefined, sensorType);
  await dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(sensor).assert(param+"(d) == c"));
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
    forAll("d").ofType(uris.DYMO).forAll("c").in(random).assert("DurationRatio(d) == 1/c"));
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

async function addConstraintSlider(expression: string, vars: {}, dymoGen: DymoGenerator, directed?: boolean) {
  let slider = await dymoGen.addControl(expression, uris.SLIDER);
  let constraint = forAll("c").in(slider);
  Object.keys(vars).forEach(k => constraint = constraint.forAll(k).in(vars[k]));
  await dymoGen.addConstraint(constraint.assert("c == "+expression, directed));
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