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

Promise.all([
  //createExampleFile('control-rendering.json', generateControlRendering()),
  //createExampleFile('similarity-rendering.json', generateSimilarityRendering()),
  createSimpleDymo('example/'),
  //createExampleFile('mixdymo-rendering.json', createMixDymoRendering()),
])
.then(() => console.log('done!'))
.then(() => process.exit());

function createExampleFile(path: string, generated: Promise<string>): Promise<any> {
  return generated
    .then(j => j.replace('http://tiny.cc/dymo-context', ONTOLOGIES_PATH+'dymo-context.json'))
    .then(j => JSON.stringify(JSON.parse(j), null, 2))
    .then(j => writeFile(GOAL_PATH+path, j));
}

function writeJsonld(jsonld: string, path: string): Promise<any> {
  jsonld = jsonld.replace('http://tiny.cc/dymo-context', ONTOLOGIES_PATH+'dymo-context.json');
  jsonld = JSON.stringify(JSON.parse(jsonld), null, 2);
  return writeFile(GOAL_PATH+path, jsonld);
}

function createStoreAndGens(): Promise<StoreAndGens> {
  let sg: StoreAndGens = { store: null, dymoGen: null, expressionGen: null };
  sg.store = new DymoStore();
  console.log(SERVER_PATH+'node_modules/dymo-core/ontologies/')
  //'https://semantic-player.github.io/dymo-core/ontologies/'
  return sg.store.loadOntologies(ONTOLOGIES_PATH).then(() => {
    sg.dymoGen = new DymoGenerator(sg.store);
    sg.expressionGen = new ExpressionGenerator(sg.store);
    return sg;
  });
}

function createSimpleDymo(path: string): Promise<any> {
  return createStoreAndGens().then(sg => {
    let dymo = sg.dymoGen.addDymo(undefined, 'blib.m4a', uris.CONJUNCTION);
    let rendering = sg.dymoGen.addRendering(undefined, dymo);
    let slider = sg.dymoGen.addControl("Amp", uris.SLIDER);
    let random = sg.dymoGen.addControl(null, uris.RANDOM);
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
      sg.store.uriToJsonld(dymo).then(j => writeJsonld(j, path+'dymo.json')),
      sg.store.uriToJsonld(rendering).then(j => writeJsonld(j, path+'rendering.json'))
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

function writeFile(path: string, content: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, (err) => {
      if (err) return reject(err);
      resolve('file saved at ' + path);
    });
  });
}