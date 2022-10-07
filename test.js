#!/usr/bin/env node
import { strict as assert } from 'assert';
import path from 'path';
import rsend from './index.js';

const expected = `# this is the header
# we are testing things
mkdir "test/v2/dest/my-documents"
mkdir "test/v2/dest/my-documents/music"
mkdir "test/v2/dest/dbye"
mkdir "test/v2/dest/dbye/bye"
mkdir "test/v2/dest/a/b"
mkdir "test/v2/dest/a/b/c"
mkdir "test/v2/dest/sub"
mkdir "test/v2/dest/games"
mkdir "test/v2/dest/games/rott"
mkdir "test/v2/dest/games/rott/manual"
mkdir "test/v2/dest/games/dott"
mkdir "test/v2/dest/my-documents/3d-stuff"
mkdir "test/v2/dest/my-documents/3d-stuff/blender"
put "test/v2/src/my-documents/music/some-file.mp3" "test/v2/dest/my-documents/music/some-file.mp3"
put "test/v2/src/dbye/bye/not-yet.txt" "test/v2/dest/dbye/bye/not-yet.txt"
put "test/v2/src/a/b/c/x.txt" "test/v2/dest/a/b/c/x.txt"
put "test/v2/src/c.txt" "test/v2/dest/c.txt"
put "test/v2/src/sub/sub-a.txt" "test/v2/dest/sub/sub-a.txt"
put "test/v2/src/games/rott/manual/index.html" "test/v2/dest/games/rott/manual/index.html"
put "test/v2/src/.checksums.json" "test/v2/dest/.checksums.json"
put "test/v2/src/SMARTSUM" "test/v2/dest/SMARTSUM"
put "test/v2/src/games/dott/dott-ega.exe" "test/v2/dest/games/dott/dott-ega.exe"
put "test/v2/src/games/rott/play.exe" "test/v2/dest/games/rott/play.exe"
put "test/v2/src/my-documents/3d-stuff/blender/bork.blend" "test/v2/dest/my-documents/3d-stuff/blender/bork.blend"
put "test/v2/src/my-documents/3d-stuff/blender/old-version.blend" "test/v2/dest/my-documents/3d-stuff/blender/old-version.blend"
put "test/v2/src/checksums.json" "test/v2/dest/checksums.json"
put "test/v2/src/a/a.txt" "test/v2/dest/a/a.txt"
rm "test/v2/dest/bye/bye/bye.txt"
rmdir "test/v2/dest/bye/bye"`;

const actual = await rsend(
  {
    kind: 'sftp',
    fingerprint: { mtime:true, size:true, hash:'sha256' },
    guarantee: [ 'hash' ],
  
    separator: '/',
    silent: false,
    src: {
      sum: 'checksums.json', // name of file
      dir: path.resolve('./test/v2/src')
    },
    dest: {
      dir: './test/v2/dest',
      sum: './test/v2/dest/checksums.json' // path to file, can be http:
    },
    header: [
      '# this is the header',
      '# we are testing things'
    ],
    create: {},
    remove: {
      // disable: true,
      order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM']
    },
    update: {
      order: [ 'tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM' ]
    }
  }
);
 
assert.equal(actual.script.split('\n').map(o => o.replace(new RegExp(`${path.resolve('.')}/`), '')).join('\n'), expected)