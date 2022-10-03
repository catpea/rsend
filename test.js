#!/usr/bin/env node

import {equal, deepEqual} from 'assert';
import path from 'path';
import rsend from './index.js';

// const expected = true;
//
// const actual = await rsend('test/new-version', 'test/old-version/', {
//   remove: {command: 'rm', partition: 4, template:({target})=>`${source} ${destination}`},
//   upload: {command: 'put', template:({source, destination})=>`${source} ${destination}`},
// });
//
// /// https://catpea.com/SHA256SUM
// // equal(actual, expected);
// console.log(actual);
//



// const actual = await rsend('test/new-version', 'test/old-version/SHA256SUM', {
//   remove: {command: 'rm', partition: 4, template:({target})=>`${source} ${destination}`},
//   upload: {command: 'put', template:({source, destination})=>`${source} ${destination}`},
// });
//


// const actual = await rsend('/home/meow/Universe/Development/catpea-project/dist/server/www/catpea-com', 'https://catpea.com/SHA256SUM', {

// const actual = await rsend('/home/meow/Universe/Development/catpea-project/dist/server/www/catpea-com', '/lamp0/web/vhosts/default/www/catpea-net', '/home/meow/catpea-com-SHA256SUM', {
//
//     remove: {
//       disable: true,
//       order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM'],
//       template:({name, destination})=>`xrm "${destination}/${name}"`,
//       filter: null
//     },
//
//     update: {
//       order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
//       template:({name, source, destination})=>`xput "${source}/${name}" "${destination}/${name}"`,
//       filter: null //file=>path.extname(file)==='.html'
//     },
// });



{
const expected = {
  create: [ 'new-dir/created.txt' ],
  update: [ 'changed.txt' ],
  remove: [ 'deleted.txt' ],
  normal: [ 'same.txt' ],
}
;
const actual = await rsend('test/new-version', 'test/server-version', 'test/old-version/SHA256SUM', {
  silent: true,
      remove: {
        disable: true,
        order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM'],
        template:({name, destination})=>`xrm "${destination}/${name}"`,
        filter: null
      },
      create: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        template:({name, source, destination})=>`xput "${source}/${name}" "${destination}/${name}"`,
        filter: null //file=>path.extname(file)==='.html'
      },
      update: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        template:({name, source, destination})=>`xput "${source}/${name}" "${destination}/${name}"`,
        filter: null //file=>path.extname(file)==='.html'
      },
});
deepEqual(actual, expected);
}


/*

const actual = await rsend(
  '/home/meow/Universe/Development/catpea-project/dist/server/www/catpea-com',
  '/lamp0/web/vhosts/default/www/catpea-net',
  '/home/meow/catpea-com-SHA256SUM', {
    // // silent: true,
    remove: {
      disable: true,
      order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM'],
      template:({name, destination})=>`xrm "${destination}/${name}"`,
      filter: null
    },

    update: {
      order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
      template:({name, source, destination})=>`put "${source}/${name}" "${destination}/${name}"`,
      // // filter: file=>path.extname(file)==='.html'
    },

});

*/