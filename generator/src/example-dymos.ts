import 'isomorphic-fetch';
import * as fs from 'fs';
import * as express from 'express';
import { DymoStore, DymoGenerator, ExpressionGenerator, uris } from 'dymo-core';

//start local server to get files

let PORT = '4111';
let SERVER_PATH = 'http://localhost:' + PORT + '/';

var app = express();
app.use(express["static"](__dirname));
var server = app.listen(PORT);
console.log('server started at '+SERVER_PATH);

interface StoreAndGens {
  store: DymoStore,
  dymoGen: DymoGenerator,
  expressionGen: ExpressionGenerator
}

let ONTOLOGIES_PATH = 'https://semantic-player.github.io/dymo-core/ontologies/';
let GOAL_PATH = 'src/assets/dymos/';

//generate examples
createSimpleDymo('example', 'example/')
.then(() => createConstraintsExample('constraints', 'constraints/'))
.then(() => console.log('done!'))
.then(() => process.exit());

function createStoreAndGens(): Promise<StoreAndGens> {
  let sg: StoreAndGens = { store: null, dymoGen: null, expressionGen: null };
  sg.store = new DymoStore();
  //console.log(SERVER_PATH+'node_modules/dymo-core/ontologies/')
  //'https://semantic-player.github.io/dymo-core/ontologies/'
  return sg.store.loadOntologies(ONTOLOGIES_PATH).then(() => {
    sg.dymoGen = new DymoGenerator(sg.store);
    sg.expressionGen = new ExpressionGenerator(sg.store);
    return sg;
  });
}

function createSimpleDymo(name: string, path: string): Promise<any> {
  return createStoreAndGens().then(sg => {
    let dymo = sg.dymoGen.addDymo(undefined, 'blib.m4a', uris.CONJUNCTION);
    let rendering = sg.dymoGen.addRendering(undefined, dymo);
    let slider = sg.dymoGen.addControl("Amp", uris.SLIDER);
    let random = sg.dymoGen.addControl(null, uris.BROWNIAN);
    //mapTo(slider).to(uris.AMPLITUDE, dymo)
    //forAll("x", uris.DYMO).forAll("c", slider).constrain("Amplitude(x) == c")
    sg.expressionGen.addConstraint(rendering, `
      ∀ x : `+uris.DYMO+`
      => ∀ c in ["`+slider+`"]
      => Amplitude(x) == c
    `);
    sg.expressionGen.addConstraint(rendering, `
      ∀ x : `+uris.DYMO+`
      => ∀ c in ["`+random+`"]
      => Amplitude(x) == c
    `);
    sg.expressionGen.addConstraint(rendering, `
      ∀ x : `+uris.DYMO+`
      => ∀ c in ["`+random+`"]
      => PlaybackRate(x) == 1-c
    `);

    return Promise.all([
      sg.store.uriToJsonld(dymo).then(j => writeJsonld(j, path, 'dymo.json')),
      sg.store.uriToJsonld(rendering).then(j => writeJsonld(j, path, 'rendering.json')),
      updateConfig(name, path)
    ])
  });
}

function createConstraintsExample(name: string, path: string) {
  return createStoreAndGens().then(sg => {
    let D = sg.dymoGen.addDymo();
    let rendering = sg.dymoGen.addRendering(undefined, D);
    let a = sg.dymoGen.addControl("a", uris.SLIDER);
    let b = sg.dymoGen.addControl("b", uris.SLIDER);
    let c = sg.dymoGen.addControl("1-a", uris.SLIDER);
    let d = sg.dymoGen.addControl("a+b", uris.SLIDER);
    //let e = sg.dymoGen.addControl("a-b", uris.SLIDER);
    let f = sg.dymoGen.addControl("a*b", uris.SLIDER);
    sg.expressionGen.addConstraint(rendering, `
      ∀ a in ["`+a+`"]
      => ∀ c in ["`+c+`"]
      => c == 1-a
    `);
    sg.expressionGen.addConstraint(rendering, `
      ∀ a in ["`+a+`"]
      => ∀ b in ["`+b+`"]
      => ∀ d in ["`+d+`"]
      => d == a+b
    `);
    /*sg.expressionGen.addConstraint(rendering, `
      ∀ a in ["`+a+`"]
      => ∀ b in ["`+b+`"]
      => ∀ e in ["`+e+`"]
      => e == a-b
    `);*/
    sg.expressionGen.addConstraint(rendering, `
      ∀ a in ["`+a+`"]
      => ∀ b in ["`+b+`"]
      => ∀ f in ["`+f+`"]
      => f == a*b
    `);

    return Promise.all([
      sg.store.uriToJsonld(D).then(j => writeJsonld(j, path, 'dymo.json')),
      sg.store.uriToJsonld(rendering).then(j => writeJsonld(j, path, 'rendering.json')),
      updateConfig(name, path)
    ])
  });
}

function createMixDymo() {
  return createStoreAndGens().then(sg => {
    let mixDymoUri = sg.dymoGen.addDymo(null, null, uris.CONJUNCTION, uris.CONTEXT_URI+"mixdymo");
    let fadeParam = sg.dymoGen.addCustomParameter(uris.CONTEXT_URI+"Fade", mixDymoUri);
    let tempoParam = sg.dymoGen.addCustomParameter(uris.CONTEXT_URI+"Tempo", mixDymoUri);
    sg.dymoGen.addDymo(mixDymoUri, null, uris.DISJUNCTION, uris.CONTEXT_URI+"dymo0");
    sg.dymoGen.addDymo(mixDymoUri, null, uris.DISJUNCTION, uris.CONTEXT_URI+"dymo00");
    sg.expressionGen.addConstraint(mixDymoUri, `
      ∀ d : `+uris.DYMO+`, LevelFeature(d) == 1
      => ∀ f in ["`+fadeParam+`"]
      => Amplitude(d) == (1-f)*(1-IndexFeature(d)) + f*IndexFeature(d)
    `);
    sg.expressionGen.addConstraint(mixDymoUri, `
      ∀ d : `+uris.DYMO+`, LevelFeature(d) == 3
      => ∀ t in ["`+tempoParam+`"]
      => TimeStretchRatio(d) == t/60*DurationFeature(d)
    `);
    return sg.store.uriToJsonld(mixDymoUri);
  });
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
      dymoinfo["dymoUri"] = (GOAL_PATH+path+"dymo.json").replace('src/','');
      dymoinfo["renderingUri"] = (GOAL_PATH+path+"rendering.json").replace('src/','');
      fs.writeFile(configfile, JSON.stringify(content, null, 2), (err) => {
        if (err) return reject(err);
        resolve('file updated at ' + configfile);
      });
    })
  });
}