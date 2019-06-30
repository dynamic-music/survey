import * as fs from 'fs';
import { SuperDymoStore, DymoGenerator, DymoTemplates, uris, forAll } from 'dymo-core';
import { DymoWriter } from './dymo-writer';
import { SERVER_PATH } from './server';

const LOCATION = "swindon,uk";
const WEATHER_API_KEY = "http://api.openweathermap.org/data/2.5/weather?appid=3d77879a046ee9e970e66bb2f5c5200d&q="+LOCATION;
let dymoGen: DymoGenerator;
let store: SuperDymoStore;

new DymoWriter('src/assets/dymos/', 'src/assets/config.json').generateAndWriteDymos([
  {name: 'machine', path: 'machine/', func: generate}
]);


async function generate(gen: DymoGenerator) {
  dymoGen = gen;
  store = gen.getStore();
  return initTracyDymo2();
}

async function initTracyDymo2(): Promise<any> {
  var machine = await dymoGen.addDymo(null, null, uris.SEQUENCE);
  await dymoGen.addRendering(machine);

  //add audio and features
  let loops = await addAudioWithFeatures('machine/133/loops/', uris.CONJUNCTION);
  let verseVocals = await addAudioWithFeatures('machine/133/verse/', uris.DISJUNCTION);
  let chorusVocals = await addAudioWithFeatures('machine/133/chorus/', uris.DISJUNCTION);

  //create loop sets
  let introLoops = await addSelectionOfSources(["BELL", "SYNTH", "SOUND", "HORN", "DRUMS2"]);
  let verseLoops = await addSelectionOfSources(["loops"], ["DRUMS3", "PIANO"]);
  let m8Loops = await addSelectionOfSources(["Light_BASS", "STRINGS", "PIANO", "SOUND", "BELL"]);

  //create sections
  var intro = await addSongSection(machine, [introLoops]);
  var verse1 = await addSongSection(machine, [verseLoops, verseVocals]);
  var verse2 = await addSongSection(machine, [verseLoops, verseVocals]);
  var chorus1 = await addSongSection(machine, [loops, chorusVocals]);
  var middle8 = await addSongSection(machine, [middle8, m8Loops]);
  var verse3 = await addSongSection(machine, [verseLoops, verseVocals]);
  var chorus2 = await addSongSection(machine, [loops, chorusVocals]);
  var chorus3 = await addSongSection(machine, [loops, chorusVocals]);

  let constraint = await createDistributionConstraint(
    machine, await store.findParts(loops), "Weight",
    [
      {"parameter": "coldness", "feature": "logcentroid"},
      //{"parameter": "brightness", "feature": "frequency"},
      //{"parameter": "loudness", "feature": "amplitude"},
      {"parameter": "flux", "feature": "spectralflux"},
      {"parameter": "intensitity", "feature": "intensity"},
      {"parameter": "activity", "feature": "avgonsetfreq"},
      //{"parameter": "mood", "feature": "tuning"},
      //{"parameter": "tempoo", "feature": "tempo"}
    ]
  );

  console.log(constraint.toString());
  await dymoGen.addConstraint(constraint);

  //add a constraint to keep the sum of all amplitudes constant
  let loopUris = await store.findParts(loops);
  await dymoGen.addConstraint(await createSumConstraint(machine, "WeightSum", loopUris, "Weight"));

  await dymoGen.addConstraint(
    forAll("l").in(...loopUris)
    .forAll("m").in(machine)
    .assert("Amplitude(l) == 10 * Weight(l) / WeightSum(m)", true)
  )

  //set voc amp
  let vocalUris = (await store.findParts(verseVocals)).concat(await store.findParts(chorusVocals));
  Promise.all(vocalUris.map(v => dymoGen.setDymoParameter(v, uris.DYMO_ONTOLOGY_URI+"Amplitude", 2)));

  //TEMPERATURE TO WARMTH
  await addSlider("Warmth (Temperature)", machine, "coldness", true);
  await addDataControl(machine, "coldness", "return json['main']['temp']", "1-((c-273.16+5)/20)");
  //WIND TO FLUX
  await addSlider("Flux (Wind)", machine, "flux", true);
  await addDataControl(machine, "flux", "return json['wind']['speed']", "1-(c/20)");
  //CLOUDS TO INTENSITY
  await addSlider("Intensity (Clouds)", machine, "intensitity");
  await addDataControl(machine, "intensitity", "return json['clouds']['all']", "c/100");
  //DAYTIME TO ACTIVITY
  await addSlider("Activity (Time)", machine, "activity");
  await dymoGen.setDymoParameter(machine, uris.CONTEXT_URI+"activity", 0.5)
  //await addDataControl(machine, "activity", "return json['dt']", "1-Math.abs((new Date(c*1000).getHours()/12)-1);");

  loopUris.forEach(l => map(uris.SLIDER, "A("+l+")", l, "Amplitude"));
  return Promise.resolve();
}

async function createDistributionConstraint(topDymo: string, targets: string[], targetParam: string, dims) {
  let constraint = forAll("x").in(topDymo)
    .forAll("y").in(...targets);
  let multiplicands = await Promise.all(dims.map(async (dim,i) => {
    await dymoGen.addCustomParameter(topDymo, uris.CONTEXT_URI+dim.parameter);
    let p = dim.parameter+"(x)";
    let f = dim.feature+"(y)";
    let max = (await store.getAttributeInfo())
      .filter(f => f.uri == uris.CONTEXT_URI+dim.feature)[0].max;
    return "((1-"+p+") * ("+max+"-"+f+") + "+p+"*"+f+") / "+max;
  }));
  return constraint.assert(targetParam+"(y) == " + multiplicands.join("*"), true);
}

async function createSumConstraint(sumObj: string, sumParam: string, addendObjs: string[], addendParam: string) {
  await dymoGen.addCustomParameter(sumObj, uris.CONTEXT_URI+sumParam);
  await Promise.all(addendObjs.map(l => dymoGen.addCustomParameter(l, uris.CONTEXT_URI+addendParam)));
  let sumConstraint = forAll("s").in(sumObj);
  let addends = addendObjs.map((a,i) => {
    sumConstraint = sumConstraint.forAll("a"+i).in(a);
    return addendParam+"(a"+i+")";
  });
  return sumConstraint.assert(sumParam+"(s)=="+addends.join("+"), true);
}

function map(controlType: string, controlName: string, dymo: string, param: string, formula: string = "c", freq?: number) {
  constrain(controlType, controlName, dymo, param, "=="+formula, freq);
}

async function constrain(controlType: string, controlName: string, dymo: string, param: string, formula: string, freq = 200) {
  let control = await dymoGen.addControl(controlName, controlType);
  dymoGen.getStore().setControlParam(control, uris.AUTO_CONTROL_FREQUENCY, freq);
  await dymoGen.addConstraint(
    forAll("d").in(dymo).forAll("c").in(control).assert(param+"(d)"+formula));
}

async function addSongSection(parent: string, parts: string[]): Promise<string> {
  let uri = await dymoGen.addDymo(parent, null, uris.CONJUNCTION);
  Promise.all(parts.map(p => store.addPart(uri, p)));
  return uri;
}

function addAudioWithFeatures(dir: string, dymoType: string): Promise<string> {
  return loadSourcesAndFeatures(dir)
    .then(sourcesAndFeatures =>
      DymoTemplates.createMultiSourceDymo(dymoGen, null, dymoType, sourcesAndFeatures[0].map(s => dir+s), sourcesAndFeatures[1]));
}

async function addSelectionOfSources(includeStrings: string[], excludeStrings: string[] = [], dymoType = uris.CONJUNCTION) {
  var allSources = await store.findAllObjectValues(null, uris.HAS_SOURCE);
  var setSources = allSources.filter(so => includeStrings.some(s => so.indexOf(s) >= 0));
  setSources = setSources.filter(so => excludeStrings.every(s => so.indexOf(s) < 0));
  var setDymos = await Promise.all(setSources.map(s=>store.findSubject(uris.HAS_SOURCE, s)));
  var setUri = await dymoGen.addDymo(null, null, dymoType);
  Promise.all(setDymos.map(d=>store.addPart(setUri, d)));
  return setUri;
}

async function addSlider(sliderName: string, dymo: string, targetParam: string, invert?: boolean) {
  let slider = await dymoGen.addControl(sliderName, uris.SLIDER);
  let sliderFunc = invert ? "1-s" : "s";
  await dymoGen.addConstraint(
    forAll("s").in(slider).forAll("d").in(dymo).assert(targetParam+"(d) == "+sliderFunc));
}

async function addDataControl(dymo: string, targetParam: string, jsonMap: string, dataFunc: string) {
  let dataControl = await dymoGen.addDataControl(WEATHER_API_KEY, jsonMap);
  await dymoGen.addConstraint(
    forAll("c").in(dataControl).forAll("d").in(dymo).assert(targetParam+"(d) == "+dataFunc, true));
}

async function loadSourcesAndFeatures(dir: string): Promise<[string[], string[][]]> {
  let sourceFiles = await getSourceFiles(dir);
  let featureFiles = await getFeatureFiles(dir);
  let groupedFeatureFiles = sourceFiles.map(s =>
    featureFiles.filter(f => f.indexOf(removeFileExtension(s)+'_') >= 0)
      .map(f => SERVER_PATH+dir+f));
  return [sourceFiles, groupedFeatureFiles];
}

function getSourceFiles(dir: string): Promise<string[]> {
  return getFilenames(dir, ['.m4a']);
}

function getFeatureFiles(dir: string): Promise<string[]> {
  return getFilenames(dir, ['.json']);
}

function getFilenames(dir: string, extensions?: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) reject(err);
      resolve(files.filter(f => extensions.some(e => f.indexOf(e) >= 0)));
    });
  })
}

function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, content) => {
      if (err) reject(err);
      resolve(content);
    });
  });
}

function removeFileExtension(path: string): string {
  return path.slice(0, path.lastIndexOf('.'));
}