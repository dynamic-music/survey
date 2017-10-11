import 'isomorphic-fetch';
import * as fs from 'fs';
import * as express from 'express';
import { DymoStore, DymoGenerator, forAll, uris } from 'dymo-core';

//start local server to get files

let PORT = '4111';
let SERVER_PATH = 'http://localhost:' + PORT + '/';

var app = express();
app.use(express["static"](__dirname));
var server = app.listen(PORT);
console.log('server started at '+SERVER_PATH);

let ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';
let GOAL_PATH = 'src/assets/dymos/';

let store: DymoStore;
let dymoGen: DymoGenerator;

//generate examples
createAndSaveDymo('example', 'example/', createSimpleDymo)
  .then(() => createAndSaveDymo('constraints', 'constraints/', createConstraintsExample))
  .then(() => createAndSaveDymo('loop', 'loop/', createLoopTimestretchTest))
  .then(() => console.log('done!'))
  .then(() => process.exit());

function createAndSaveDymo(name: string, path: string, generatorFunc: Function): Promise<any> {
  //reset store and generator
  store = new DymoStore();
  dymoGen = new DymoGenerator(store);
  return store.loadOntologies(ONTOLOGIES_PATH)
    //run generatorFunction
    .then(() => generatorFunc())
    //save and update config
    .then(() =>
      Promise.all([
        dymoGen.getRenderingJsonld().then(j => writeJsonld(j, path, 'save.json')),
        updateConfig(name, path)
      ]));
}

function createLoopTimestretchTest() {
  dymoGen.addDymo(undefined, 'tek.wav');
  let slider = dymoGen.addControl("StretchRatio", uris.SLIDER);
  let toggle = dymoGen.addControl("Loop", uris.TOGGLE);
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(slider).assert("TimeStretchRatio(d) == 2*c"));
  dymoGen.addConstraint(
    forAll("d").ofType(uris.DYMO).forAll("c").in(toggle).assert("Loop(d) == c"));
}

function createSimpleDymo() {
  dymoGen.addDymo(undefined, 'blib.m4a');
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

function createConstraintsExample() {
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

function createMixDymo() {
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
  return store.uriToJsonld(mixDymoUri);
}

function writeJsonld(jsonld: string, path: string, filename: string): Promise<any> {
  jsonld = jsonld.replace('http://tiny.cc/dymo-context', ONTOLOGIES_PATH+'dymo-context.json');
  jsonld = JSON.stringify(JSON.parse(jsonld), null, 2);
  return writeFile(GOAL_PATH+path, filename, jsonld);
}

function writeFile(path: string, filename: string, content: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)){
      fs.mkdirSync(path);
    }
    fs.writeFile(path+filename, content, (err) => {
      if (err) return reject(err);
      resolve('file saved at ' + path+filename);
    });
  });
}

function updateConfig(name: string, path: string) {
  return new Promise((resolve, reject) => {
    var configfile = 'src/assets/config.json';
    fs.readFile(configfile, 'utf8', (err,data) => {
      var content = JSON.parse(data);
      var dymoinfo = content["dymos"].filter(d => d["name"] == name)[0];
      if (!dymoinfo) {
        dymoinfo = { "name": name }
        content["dymos"].push(dymoinfo);
      }
      dymoinfo["saveFile"] = (GOAL_PATH+path+"save.json").replace('src/','');
      fs.writeFile(configfile, JSON.stringify(content, null, 2), (err) => {
        if (err) return reject(err);
        resolve('file updated at ' + configfile);
      });
    })
  });
}