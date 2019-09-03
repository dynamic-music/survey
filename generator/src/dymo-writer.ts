import 'isomorphic-fetch';
import * as fs from 'fs';
import * as _ from 'lodash';
import { DymoGenerator, forAll, uris } from 'dymo-core';

export interface DymoDefinition {
  name: string,
  path: string,
  func: (dymoGen: DymoGenerator) => void
}

export class DymoWriter {

  private ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';

  constructor(private goalPath, private configFilePath?: string) {}

  generateAndWriteDymos(definitions: DymoDefinition[]) {
    Promise.all(definitions.map(d => this.createAndSaveDymo(d)))
      .then(() => this.configFilePath ? this.updateConfig(definitions) : Promise.resolve())
      .then(() => console.log('done!'))
      .then(() => process.exit());
  }

  private async createAndSaveDymo(definition: DymoDefinition): Promise<any> {
    //reset store and generator
    let dymoGen = new DymoGenerator(false);
    //run generatorFunction
    await definition.func(dymoGen)
    //save and update config
    const jsonld = await dymoGen.getRenderingJsonld();
    const topDymos = await dymoGen.getStore().findTopDymos();
    //console.log(jsonld.split("dymo257").length - 1);
    //console.log(topDymos, topDymos.map(d => jsonld.indexOf(d.replace(uris.CONTEXT_URI, ''))))
    await this.writeJsonld(jsonld, definition.path, 'save.json');
  }

  private writeJsonld(jsonld: string, path: string, filename: string): Promise<any> {
    jsonld = jsonld.replace('http://tiny.cc/dymo-context', this.ONTOLOGIES_PATH+'dymo-context.json');
    jsonld = JSON.stringify(JSON.parse(jsonld), null, 2);
    return this.writeFile(this.goalPath+path, filename, jsonld);
  }

  private writeFile(path: string, filename: string, content: string): Promise<any> {
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

  private updateConfig(definitions: DymoDefinition[]): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.configFilePath, 'utf8', (err,data) => {
        var content = JSON.parse(data);
        definitions.forEach(def => {
          var dymoinfo = content["dymos"].filter(d => d["name"] == def.name)[0];
          if (!dymoinfo) {
            dymoinfo = { "name": def.name }
            content["dymos"].push(dymoinfo);
          }
          dymoinfo["saveFile"] = (this.goalPath+def.path+"save.json").replace('src/','');
        })
        fs.writeFile(this.configFilePath, JSON.stringify(content, null, 2), (err) => {
          if (err) return reject(err);
          resolve('file updated at ' + this.configFilePath);
        });
      })
    });
  }

}