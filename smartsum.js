import path from 'path';
import crypto from 'crypto';
import lo from 'lodash-es';
import fs from 'fs/promises';
import {createReadStream} from 'fs';

export default ({ensure});

async function ensure({ directory, file, fingerprint = { mtime: true, size: true, hash: 'sha256' }}) {
  const root = directory;
  const location = path.join(directory, file);
  const updates = { meta: { directory, file, fingerprint }, data: await Object.fromEntries(await Promise.all((await scanner({ directory, after: await mtime(location) })).map(async ({ directory, file }) => [path.relative(root, path.join(directory, file.name)), await checksum({ directory, file, fingerprint })]))) };
  const latest = {meta:{},data:{}}; try{merge(latest, JSON.parse(await fs.readFile(location, 'utf8')))}catch{}
  const merged = lo.merge(latest, updates);
  await fs.writeFile(location, JSON.stringify(merged, null, ' '));
  return merged;
}

async function checksum({ directory, file, fingerprint }) {
  return Object.assign({}, lo.pick(file, Object.keys(fingerprint)), { hash: fingerprint.hash?await sha(path.join(directory, file.name), fingerprint.hash):undefined});
}

function sha(location, algorithm){
  return new Promise(async function (resolve, reject) {
    const hash = crypto.createHash(algorithm);
    const input = createReadStream(location);
    input.on('readable', () => {
      const data = input.read();
      if (data) {
        hash.update(data);
      } else {
        resolve(hash.digest('hex'))
      }
    });
  })
}

async function scanner({directory, list, after}) {
  let files = await Promise.all( (await fs.readdir(directory)) .map(async name=>(Object.assign(await fs.stat(path.join(directory, name)), {name}) ) ));
  list = list || [];
  for (const file of files) {
    if(file.isDirectory()){
      list = await scanner({directory: path.join(directory, file.name), list, after});
    }else{
      // if (file.mtimeMs >= after) //.getTime()
      list.push( {directory, file});
    }
  }
  return list;
}

async function mtime(location){
  let response = 0; try { response = (await fs.stat(location)).mtimeMs; } catch {}
  return response;
}