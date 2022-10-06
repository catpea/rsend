import path from 'path';
import chalk from 'chalk';
import bug from 'debug';
import sha256sum from 'sha256sum';
const log = bug('rsend');
import { existsSync } from 'fs';
import readRemote from './read-remote.js';
import sftpBatchfile from './kinds/sftp-batchfile.js';
import lftpBatchfile from './kinds/lftp-batchfile.js';
import { readFile, writeFile } from 'fs/promises';
import { difference, intersection, merge } from 'lodash-es';

export default rsend;

//localDirectory, remoteDirectory, remoteSum,
async function rsend(options, { debug = false } = {}) {


  if (debug) bug.enable('rsend');

  const kinds = {
    'sftp-batchfile': sftpBatchfile,
    'lftp-batchfile': lftpBatchfile,
  };
  const { silent, src, dest, header, create, update, remove } = merge({}, kinds[options.kind](), options,);
  const current = await local(src.dir, src.sum);
  const previous = normalizer(await readRemote(dest.sum));

  log(`${path.join(src.dir, src.sum)} vs. ${dest.sum}`);
  log(`Number of current files in SHASUM: ${current.length}, number of previous files: ${previous.length}`);

  const solution = solver(current, previous);

  log(`remove ${solution.remove.length} old file(s) (${chalk.green(exts(solution.remove).join(','))}).`);
  log(`update ${solution.update.length} existing file(s) (${chalk.green(exts(solution.update).join(','))}).`);
  log(`create ${solution.create.length} new file(s) (${chalk.green(exts(solution.create).join(','))}).`);

  let script = []
  if (solution.create.length && !create.disable) script = script.concat(sorted(solution.create, create.order).filter(i => create.filter ? create.filter(i) : true).map(o => create.template({ name: path.basename(o), source: path.join(src.dir, path.dirname(o)), destination: path.join(dest.dir, path.dirname(o)) })))
  if (solution.update.length && !update.disable) script = script.concat(sorted(solution.update, update.order).filter(i => update.filter ? update.filter(i) : true).map(o => update.template({ name: path.basename(o), source: path.join(src.dir, path.dirname(o)), destination: path.join(dest.dir, path.dirname(o)) })))
  if (solution.remove.length && !remove.disable) script = script.concat(sorted(solution.remove, remove.order).filter(i => remove.filter ? remove.filter(i) : true).map(o => remove.template({ name: path.basename(o), destination: path.join(dest.dir, path.dirname(o)) })))
  if (script.length) script.unshift(header);
  solution.script = script;

  return solution;
}

async function local(localDirectory, checksumFile) {
  const localShasum = path.join(localDirectory, checksumFile);
  if (!existsSync(localShasum)) (log(`${localShasum} not found`))
  return (!existsSync(localShasum)) ? await sums(localDirectory, checksumFile) : normalizer(await readFile(localShasum, 'utf8'))
}

async function sums(localDirectory, checksumFile) {
  const localShasum = path.join(localDirectory, checksumFile);
  const current = (await sha256sum(localDirectory + '/**/*.*')).map(([sum, file]) => [sum, file])
  if (!existsSync(localShasum)) await writeFile(localShasum, current.map(([sum, file]) => `${sum}  ${path.relative(localDirectory, file)}`).join('\n'));
  return current;
}

function solver(current, previous) {
  const [currentNames, previousNames] = [current, previous].map(list => list.map(i => i[1]));
  const [currentHash, previousHash] = [current, previous].map(list => list.map(i => i.join('  ')))
  const normal = intersection(currentHash, previousHash).map(i => i.split('  ')[1])
  const create = difference(currentNames, previousNames);
  const update = difference(intersection(previousNames, currentNames), normal);
  const remove = difference(previousNames, currentNames);
  return { create, update, remove, normal };
}

function normalizer(string) {
  return string.split('\n')
    .filter(i => i)
    .map(l => l.split('  '))
    .map(i => [i[0], i[1].replace(/^\.\//, '')])
    .filter(([hash, name]) => !name.endsWith('~'))
}

function sorted(list, spec = []) {
  let response = [];
  const db = {};
  for (let index = 0; index < list.length; index++) {
    for (const ext of spec) {
      if (!db[ext]) db[ext] = [];
      if (list[index].endsWith(ext)) {
        db[ext].push(list[index]);
      }
    }
  }
  for (const ext of spec) {
    response = response.concat(db[ext])
  }
  return response;
}

function exts(list) {

  const db = {};
  for (const item of list) {
    const ext = path.extname(item).substr(1);
    if (ext) {
      if (!db[ext]) db[ext] = 0;
      db[ext]++;
    }
  }
  return Object.entries(db).map(([k, v]) => `${k}=${v}`)

}
