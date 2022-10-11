import path, { sep } from 'path';
import chalk from 'chalk';
import bug from 'debug';
import util from 'util';
import lo from 'lodash';
import smartsum from './smartsum.js';

const log = bug('rsend');
import { existsSync } from 'fs';
import readRemote from './read-remote.js';
import sftp from './kinds/sftp.js';
import lftp from './kinds/lftp.js';
import { stat, readFile, writeFile } from 'fs/promises';
import {
  differenceBy, intersectionBy,
  difference, intersection,
 merge,
 map} from 'lodash-es';
import { equal, deepEqual } from 'assert';
export default rsend;

console.x = function(x){
  
  const showHidden = false;
  const depth = 8;
  const colorize = true;
  console.info(util.inspect( x, showHidden, depth, colorize));
  
}

//localDirectory, remoteDirectory, remoteSum,
async function rsend(options, {debug=false}={}){

  // if (debug) bug.enable('rsend');

  const kinds = { sftp, lftp };
  const { silent, fingerprint, separator, guarantee, src, dest, header, create, update, remove } = merge({}, kinds[options.kind](), options, );
  
  const current = await smartsum.ensure({ directory: src.dir, file: src.sum, fingerprint });
  const previous = { meta: {}, data: {} }; try { Object.assign(previous, JSON.parse((await readRemote(dest.sum))) ) } catch{}
  

  log(`${path.join(src.dir, src.sum)} vs. ${dest.sum}`);
  log(`Number of current files in SHASUM: ${current.data.length}, number of previous files: ${previous.length}`);
  
  const solution = solver(current, previous, guarantee );

  log(`remove ${solution.remove.length} old file(s) (${chalk.green(exts(solution.remove).join(','))}).`);
  log(`update ${solution.update.length} existing file(s) (${chalk.green(exts(solution.update).join(','))}).`);
  log(`create ${solution.create.length} new file(s) (${chalk.green(exts(solution.create).join(','))}).`);

  // console.log(solution);

  let script = [];
  const L = (x)=>{ console.x(x); return x};
  const exist = Object.fromEntries(solution.normal.map(o=> path.dirname(o) ).map(o=>[o,o]));
  

  
  if (solution.create.length && !create.disable){
    
    const filtered = sorted(solution.create, create.order).filter(i => create.filter ? create.filter(i) : true);

    // const targets = lo.uniqBy(filtered.map(o => path.dirname(o)).filter(o => o !== '.').map(o => o.split('/')).map(o => cascade2(o)).flat(1), o => o.join())
    // targets.map(o => o.map(o => [o, 'elements']).flat()).map(o => lo.set(tree, o.map(o => o), {}))
    // targets.map(o => lo.initial(o.map(o => [o, 'elements']).flat())).map(o => lo.set(tree, o.map(o => o), { name: lo.nth(o, -1), directory: true, created: false }))
    // filtered.map(o => o.split('/')).map(o => lo.initial(o.map(o => [o, 'elements']).flat())).map(o => lo.set(tree, o.map(o => o), { name: lo.nth(o, -1), file: true }))

    const directories = lo.uniqBy(filtered.map(o => path.dirname(o)) .filter(o => o !== '.').map(o => o.split('/')).map(o => cascade2(o)).flat(1), o => o.join()).map(o=>o.join('/'))
    const existingDirectories = lo.uniqBy(solution.update.map(o => path.dirname(o)) .filter(o => o !== '.').map(o => o.split('/')).map(o => cascade2(o)).flat(1), o => o.join()).map(o=>o.join('/'))
    const initialization = difference(directories, existingDirectories).map(o => create.initialize({ destination: path.join(dest.dir, path.dirname(o)), name: path.basename(o) }))
    const transport = filtered.map(o => create.execute({ name: path.basename(o), source: path.join(src.dir, path.dirname(o)), destination: path.join(dest.dir, path.dirname(o)) }))
    script = script.concat(initialization);
    script = script.concat(transport);

  }

  if (solution.update.length && !update.disable) script = script.concat(sorted(solution.update, update.order).filter(i => update.filter ? update.filter(i) : true).map(o => update.execute({ name: path.basename(o), source: path.join(src.dir, path.dirname(o)), destination: path.join(dest.dir, path.dirname(o)) })))
  
  if (solution.remove.length && !remove.disable){
  
    const filtered = sorted(solution.remove, remove.order).filter(i => remove.filter ? remove.filter(i) : true)

    // const tree = {};
    // const ls = (path, data = tree) => lo.get(data, lo.initial(path.replace(/^\//, '').replace(/\/$/, '').split(separator).map(o => [o, 'elements']).flat()))
    // const targets = lo.uniqBy(filtered.map(o => path.dirname(o)).filter(o => o !== '.').map(o => o.split('/')).map(o => cascade2(o)).flat(1), o => o.join())
    // targets.map(o => o.map(o => [o, 'elements']).flat()).map(o => lo.set(tree, o.map(o => o), {}))
    // targets.map(o => lo.initial(o.map(o => [o, 'elements']).flat())).map(o => lo.set(tree, o.map(o => o), { name: lo.nth(o, -1), directory: true, created: false }))
    // filtered.map(o => o.split('/')).map(o => lo.initial(o.map(o => [o, 'elements']).flat())).map(o => lo.set(tree, o.map(o => o), { name: lo.nth(o, -1), file: true }))
    
    const existing = lo.uniqBy(solution.update.concat(solution.create) .map(o => path.dirname(o)).filter(o => o !== '.').map(o => o.split('/')), o => o.join()).map(o => o.join('/'))
    const altered = lo.uniqBy(filtered.map(o => path.dirname(o)).filter(o => o !== '.').map(o => o.split('/')),  o => o.join()).map(o => o.join('/'))
    const emptied = difference(altered, existing);
    const removal = filtered.map(o => remove.execute({ name: path.basename(o), destination: path.join(dest.dir, path.dirname(o)) }))
    const clean = emptied.map(o => remove.clean({ name: path.basename(o), destination: path.join(dest.dir, path.dirname(o)) }))
    script = script.concat(removal)
    script = script.concat(clean)

  }
  
  if (script.length) script.unshift(...header);
  solution.script = script.filter(i=>i).join('\n');
  return solution;
}

function cascade(dir, exist, separator='/'){
const fragments = dir.split(separator);
const response = [];
  for (let a = fragments.length-1; a > -1; a--) {
    response[a] = [];
    for (let b = a; b < fragments.length; b++) {
      response[b][a] = fragments[a];
    }
  }
  
  const newones = response.map(a => a.join('/')).filter(i => !exist[i]).map((o)=>exist[o] = o)

  return newones;
 }
 
function cascade2(fragments){
  const response = [];
  for (let a = fragments.length-1; a > -1; a--) {
    response[a] = [];
    for (let b = a; b < fragments.length; b++) {
      response[b][a] = fragments[a];
    }
  }
  return response;
 }

function solver(current, previous, guarantee = ['name', 'size', 'mdate', 'hash']) {
  const lookup = o => Object.entries(o.data).map(([name, fingerprints]) => ({ name, hash: [name, ...Object.values(lo.pick(fingerprints, guarantee))].join() }));
  const [currentNames, previousNames] = [current, previous].map(o => Object.keys(o.data));
  const [currentHash, previousHash] = [current, previous].map(o => lookup(o));
  const normal = intersectionBy(currentHash, previousHash, o => o.hash).map(o => o.name);
  const create = difference(currentNames, previousNames);
  const update = difference(intersection(previousNames, currentNames), normal);
  const remove = difference(previousNames, currentNames);
  return { create, update, remove, normal };
}

 




function normalizer(string){
  return string.split('\n')
  .filter(i=>i)
  .map(l=>l.split('  '))
  .map(i=>[i[0], i[1].replace(/^\.\//,'')])
  .filter(([hash, name])=>!name.endsWith('~'))
}

function sorted(input, spec=[]){
  const list = lo.clone(input);

  let response = [];
  const db = {};

  for (let index = 0; index < list.length; index++) {
    for(const ext of spec){
    if(!db[ext]) db[ext] = [];
      if (list[index] && list[index].endsWith(ext)){
        db[ext].push(list[index]);
        list[index] = undefined;
      }
    }
  }

  for(const ext of spec){
    response = response.concat(db[ext])
  }

  return response.concat(list.filter(i=>i));
}

function exts(list){

  const db = {};
  for(const item of list){
    const ext = path.extname(item).substr(1);
    if(ext){
    if(!db[ext]) db[ext] = 0;
    db[ext]++;
    }
  }
  return Object.entries(db).map(([k,v])=>`${k}=${v}`)

}