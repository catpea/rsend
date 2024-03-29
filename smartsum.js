import fs from 'fs/promises';
import {createReadStream} from 'fs';
import path from 'path';
import crypto from 'crypto';
import lo from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';

export default ({ensure});

async function ensure({ directory, file, fingerprint = { mtime: true, size: true, hash: 'sha256' }}) {
  const root = directory;
  const location = path.join(directory, file);
  const updates = { meta: { directory, file, fingerprint }, data: await Object.fromEntries( await Promise.all((await scanner({ directory })).map(async ({ directory, file }) => [path.relative(root, path.join(directory, file.name)), await checksum({ directory, file, fingerprint, after: await modified(location) })  ]))) };
  const latest = {meta:{},data:{}}; try{lo.merge(latest, JSON.parse(await fs.readFile(location, 'utf8')))}catch{}
  const merged = lo.mergeWith(latest, updates);
  Object.entries(merged.data) .filter(([name, properties]) => !properties.exists) .map(([name, properties]) => delete merged.data[name]);
  Object.entries(merged.data) .filter(([name, properties]) => properties.exists) .map(([name, properties]) => delete merged.data[name].exists);
  merged.meta.guid = uuidv4();
  await fs.writeFile(location, JSON.stringify(merged, null, ' '));
  return merged;
}

async function checksum({ directory, file, fingerprint, after }) {
  const response = {};
  Object.assign(response, lo.pick(file, Object.keys(fingerprint)))
  Object.assign(response, {exists:true})
  if (fingerprint.hash){
    const location = path.join(directory, file.name);
    const timestamp = await modified(location);
    const changed = (timestamp >= after);
    if (changed) {
      Object.assign(response, { hash: await sha(location, fingerprint.hash)} )
    }
  }
  return response;
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

async function scanner({directory, list}) {
  let files = await Promise.all( (await fs.readdir(directory)) .map(async name=>(Object.assign(await fs.stat(path.join(directory, name)), {name}) ) ));
  list = list || [];
  for (const file of files) {
    if(file.isDirectory()){
      list = await scanner({directory: path.join(directory, file.name), list});
    }else{
      list.push( {directory, file});
    }
  }
  return list;
}

async function modified(location){
  let response = 0; try { response = (await fs.stat(location)).mtimeMs; } catch {}
  return response;
}