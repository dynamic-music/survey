import { DymoStore, DymoGenerator, forAll, uris } from 'dymo-core';
import { DymoWriter, DymoDefinition } from './dymo-writer';


new DymoWriter('src/assets/dymos/', 'src/assets/config.json').generateAndWriteDymos([
  {name: 'example', path: 'example/', func: createSimpleDymo},
  {name: 'constraints', path: 'constraints/', func: createConstraintsExample},
  {name: 'loop', path: 'loop/', func: createLoopTimestretchTest},
  {name: 'sensor', path: 'sensor/', func: createSensorExample}
]);


function createSensorExample(dymoGen: DymoGenerator) {
  dymoGen.addDymo(undefined, 'loop.wav');
  addSensorSliderConstraint(dymoGen, "Amp", uris.ACCELEROMETER_X, "Amplitude");
  addSensorSliderConstraint(dymoGen, "Rate", uris.ACCELEROMETER_Y, "PlaybackRate");
  addSensorSliderConstraint(dymoGen, "Verb", uris.ACCELEROMETER_Z, "Reverb");
}

function addSensorSliderConstraint(dymoGen: DymoGenerator, name: string, sensorType: string, param: string) {
  let slider = dymoGen.addControl(name, uris.SLIDER);
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert(param+"(d) == c"));
  let sensor = dymoGen.addControl(undefined, sensorType);
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(sensor).assert(param+"(d) == c"));
}

function createLoopTimestretchTest(dymoGen: DymoGenerator) {
  dymoGen.addDymo(undefined, 'loop.wav');
  let slider = dymoGen.addControl("StretchRatio", uris.SLIDER);
  let toggle = dymoGen.addControl("Loop", uris.TOGGLE);
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert("TimeStretchRatio(d) == 2*c"));
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(toggle).assert("Loop(d) == c"));
}

function createSimpleDymo(dymoGen: DymoGenerator) {
  dymoGen.addDymo(undefined, 'creak.wav');
  let slider = dymoGen.addControl("Amp", uris.SLIDER);
  let random = dymoGen.addControl(null, uris.BROWNIAN);
  let toggle = dymoGen.addControl("Play", uris.TOGGLE);
  let button = dymoGen.addControl("Play", uris.BUTTON);
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert("Amplitude(d) == c"));
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(random).assert("Amplitude(d) == c"));
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(random).assert("PlaybackRate(d) == 1-c"));
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(toggle).assert("Play(d) == c"));
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(button).assert("Play(d) == c"));
}

function createConstraintsExample(dymoGen: DymoGenerator) {
  dymoGen.addDymo();
  let a = dymoGen.addControl("a", uris.SLIDER);
  let b = dymoGen.addControl("b", uris.SLIDER);
  addConstraintSlider("1-a", {"a":a}, dymoGen);
  addConstraintSlider("a+b", {"a":a,"b":b}, dymoGen);
  addConstraintSlider("a-b", {"a":a,"b":b}, dymoGen);
  addConstraintSlider("a*b", {"a":a,"b":b}, dymoGen);
  addConstraintSlider("a/b", {"a":a,"b":b}, dymoGen);
  addConstraintSlider("(a>b?a:b)", {"a":a,"b":b}, dymoGen, true);
  addConstraintSlider("sin(a)", {"a":a}, dymoGen, true);
}

function addConstraintSlider(expression: string, vars: {}, dymoGen: DymoGenerator, directed?: boolean) {
  let slider = dymoGen.addControl(expression, uris.SLIDER);
  let constraint = forAll("c").in(slider);
  Object.keys(vars).forEach(k => constraint = constraint.forAll(k).in(vars[k]));
  dymoGen.addConstraint(constraint.assert("c == "+expression, directed));
}

function createMixDymo(dymoGen: DymoGenerator) {
  let mixDymoUri = dymoGen.addDymo(null, null, uris.CONJUNCTION, uris.CONTEXT_URI+"mixdymo");
  let fadeParam = dymoGen.addCustomParameter(uris.CONTEXT_URI+"Fade", mixDymoUri);
  let tempoParam = dymoGen.addCustomParameter(uris.CONTEXT_URI+"Tempo", mixDymoUri);
  dymoGen.addDymo(mixDymoUri, null, uris.DISJUNCTION, uris.CONTEXT_URI+"dymo0");
  dymoGen.addDymo(mixDymoUri, null, uris.DISJUNCTION, uris.CONTEXT_URI+"dymo00");
  dymoGen.addConstraint(
    forAll("d").ofTypeWith(uris.DYMO, "LevelFeature(d) == 1")
      .forAll("f").in(fadeParam)
      .assert("Amplitude(d) == (1-f)*(1-IndexFeature(d)) + f*IndexFeature(d)"));
  dymoGen.addConstraint(
    forAll("d").ofTypeWith(uris.DYMO, "LevelFeature(d) == 3")
      .forAll("t").in(tempoParam)
      .assert("TimeStretchRatio(d) == t/60*DurationFeature(d)"));
  return dymoGen.getStore().uriToJsonld(mixDymoUri);
}