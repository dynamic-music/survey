import * as fs from 'fs';
import { exec } from 'child_process';

const audiodirs = ['audio2/']//G1/', 'audio/G2/'];

const features = [
  'vamp:vamp-example-plugins:spectralcentroid:logcentroid',
  'vamp:bbc-vamp-plugins:bbc-spectral-flux:spectral-flux',
  'vamp:bbc-vamp-plugins:bbc-intensity:intensity',
  'vamp:bbc-vamp-plugins:bbc-rhythm:avg-onset-freq',
  'vamp:nnls-chroma:chordino:simplechord',
  'vamp:bbc-vamp-plugins:bbc-energy:rmsenergy',
  'vamp:mtg-melodia:melodia:melody'
];

audiodirs.forEach(async d => {
  console.log('converting to wav')
  const m4as = fs.readdirSync(d).filter(f => f.indexOf('.m4a') >= 0);
  await Promise.all(m4as.map(f =>
    execute('ffmpeg -y -i "'+d+f+'" "'+(d+f).replace('.m4a', '.wav')+'"')));
  const wavs = fs.readdirSync(d).filter(f => f.indexOf('.wav') >= 0);
  await mapSeries(features, feature => {
    console.log('extracting', feature);
    return mapSeries(wavs, async f => {
      const fname = feature.slice(feature.lastIndexOf(':')+1)//.replace(/-/g, '');
      const j = (d+f).replace('.wav', '');
      if (!fs.existsSync(j+'_'+fname+'.json')) {
        await execute('sonic-annotator -d '+feature+' "'+d+f+'" -w jams --force');
        return execute('mv "'+j+'.json" "'+j+'_'+fname+'.json"');
      }
    });
  });
});

function execute(command: string): Promise<any> {
  return new Promise((resolve, reject) =>
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject('failed to execute "'+command+'": '+JSON.stringify(error));
      } else {
        resolve();
      }
    })
  )
}

async function mapSeries<T,S>(array: T[], func: (arg: T, i: number) => Promise<S>): Promise<S[]> {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(await func(array[i], i));
  }
  return result;
}