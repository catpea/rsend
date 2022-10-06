#!/usr/bin/env node

import {equal, deepEqual} from 'assert';
import { log } from 'debug/src/browser.js';
import path from 'path';
import rsend from './index.js';


const expected = {
  "create": [
    ".checksums.json",
    "SMARTSUM",
    "a.txt",
    "c.txt",
    "sub-a.txt"
  ],
  "update": [],
  "remove": [],
  "normal": [
    "b.txt"
  ],
  "script": [
    [
      "# this is the header",
      "# we are testing things"
    ],
    "mkdir -p \"test/v2/dest\"\nput \"/home/meow/Universe/Development/npm/rsend/test/v2/src/a.txt\" -o \"test/v2/dest/a.txt\"",
    "mkdir -p \"test/v2/dest\"\nput \"/home/meow/Universe/Development/npm/rsend/test/v2/src/c.txt\" -o \"test/v2/dest/c.txt\"",
    "mkdir -p \"test/v2/dest\"\nput \"/home/meow/Universe/Development/npm/rsend/test/v2/src/sub-a.txt\" -o \"test/v2/dest/sub-a.txt\""
  ]
};

const actual = await rsend(
  {
    kind: 'sftp',
    fingerprint: { mtime:true, size:true, hash:'sha256' },
    guarantee: [ 'hash' ],
    
    
    mkdir: { enabled: true, parents:true},
    separator: '/',
    silent: false,
    src: {
      sum: '.checksums.json',
      dir: path.resolve('./test/v2/src')
    },
    dest: {
      dir: './test/v2/dest',
      sum: './test/v2/dest/.checksums.json'
    },
    header: [
      '# this is the header',
      '# we are testing things'
    ],
    create: {},
    remove: {
      disable: true,
      order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM']
    },
    update: {
      order: [ 'tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM' ]
    }
  }
);


// console.log('###########################');
// console.log(JSON.stringify(actual, null, '  '));

console.log(actual.script);