import path, { sep } from 'path';
import chalk from 'chalk';
import bug from 'debug';
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
 merge} from 'lodash-es';
import { equal, deepEqual } from 'assert';
export default rsend;

//localDirectory, remoteDirectory, remoteSum,
async function rsend(options, {debug=false}={}){

  if (debug) bug.enable('rsend');

  const kinds = { sftp, lftp };
  const { silent, fingerprint, separator, guarantee, src, dest, header, create, update, remove } = merge({}, kinds[options.kind](), options, );
  
  const current = await smartsum.ensure({ directory: src.dir, file: src.sum, fingerprint });

  const previous = JSON.parse((await readRemote(dest.sum)))||{meta:{},data:{}};

  log(`${path.join(src.dir, src.sum)} vs. ${dest.sum}`);
  log(`Number of current files in SHASUM: ${current.data.length}, number of previous files: ${previous.length}`);
  
  const solution = solver(current, previous, guarantee );

  log(`remove ${solution.remove.length} old file(s) (${chalk.green(exts(solution.remove).join(','))}).`);
  log(`update ${solution.update.length} existing file(s) (${chalk.green(exts(solution.update).join(','))}).`);
  log(`create ${solution.create.length} new file(s) (${chalk.green(exts(solution.create).join(','))}).`);

  let script = [];
  const L = (x)=>{ console.log(x); return x};
  const exist = Object.fromEntries(solution.normal.map(o=> path.dirname(o) ).map(o=>[o,o]));
  if (solution.create.length && !create.disable) script = script.concat(sorted(solution.create, create.order).filter(i => create.filter ? create.filter(i) : true).map(o => path.dirname(o)).filter(i => i !== '.').filter(i => !exist[i]).map(o => [create.initialize({ destination: dest.dir, directory: o, directories: cascade(o, exist, separator) }), o]).map(([a, o]) => { [exist[o] = o]; return a }))
  if (solution.create.length && !create.disable) script = script.concat(sorted(solution.create, create.order).filter(i => create.filter ? create.filter(i) : true).map(o => create.execute({ name: path.basename(o), source: path.join(src.dir, path.dirname(o)), destination: path.join(dest.dir, path.dirname(o)) })))
  if (solution.update.length && !update.disable) script = script.concat(sorted(solution.update, update.order).filter(i => update.filter ? update.filter(i) : true).map(o => update.execute({ name: path.basename(o), source: path.join(src.dir, path.dirname(o)), destination: path.join(dest.dir, path.dirname(o)) })))
  if (solution.remove.length && !remove.disable) script = script.concat(sorted(solution.remove, remove.order).filter(i => remove.filter ? remove.filter(i) : true).map(o => remove.execute({ name: path.basename(o), destination: path.join(dest.dir, path.dirname(o)) })))
  if (script.length) script.unshift(...header);
  solution.script = script.join('\n');
  return solution;
}

 
function cascade(dir, exist, separator='/'){
  const fragments = dir.split(separator);
  const response = [];
  for (let a = fragments.length-1; a > -1; a--) {
    const A = fragments[a];
    response[a] = [];
    for (let b = a; b < fragments.length; b++) {
        response[b][a] = A
    }
  }
  return response.map(a => a.join('/')).filter(i => !exist[i])
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

function sorted(list, spec=[]){
  let response = [];
  const db = {};
  for (let index = 0; index < list.length; index++) {
    for(const ext of spec){
    if(!db[ext]) db[ext] = [];
      if(list[index].endsWith(ext)){
        db[ext].push(list[index]);
      }
    }
  }
  for(const ext of spec){
    response = response.concat(db[ext])
  }
  return response;
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
 