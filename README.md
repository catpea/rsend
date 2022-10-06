# rsend 2.0

Uploading is hard, it is the reason why all the crappy programs exist,
rsend aims to respectfully solve this problem.

It will work with existing SHA256SUM,
and in the future with other ways to discover changes.

The correct way to upload the right files,
is to write all your software correctly.

rsend is for the people,
who didn't do it right.

## USAGE

```JavaScript

const solution = await rsend(
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

```

```solution.script``` will contain the command you have to run:

```shell

# this is the header
# we are testing things
mkdir "./test/v2/dest/a/b"
mkdir "./test/v2/dest/a/b/c"
mkdir "./test/v2/dest/sub"
put "/home/user/Universe/Development/npm/rsend/test/v2/src/a/b/c/x.txt" "test/v2/dest/a/b/c/x.txt"
put "/home/user/Universe/Development/npm/rsend/test/v2/src/b.txt" "test/v2/dest/b.txt"
put "/home/user/Universe/Development/npm/rsend/test/v2/src/c.txt" "test/v2/dest/c.txt"
put "/home/user/Universe/Development/npm/rsend/test/v2/src/sub/sub-a.txt" "test/v2/dest/sub/sub-a.txt"

```

## Theory Of Operation

Figure out what files have changed and,
and give the user an object with three arrays: create, update, remove.

This is the solver that provides those lists, there is nothing to it:

```JavaScript

function solver(current, previous, pick = ['name', 'size', 'mdate', 'hash']) {
  const lookup = o => Object.entries(o.data).map(([name, fingerprints]) => ({ name, hash: [name, ...Object.values(lo.pick(fingerprints, pick))].join() }));
  const [currentNames, previousNames] = [current, previous].map(o => Object.keys(o.data));
  const [currentHash, previousHash] = [current, previous].map(o => lookup);
  const normal = intersectionBy(currentHash, previousHash, o => o.hash).map(o => o.name);
  const create = difference(currentNames, previousNames);
  const update = difference(intersection(previousNames, currentNames), normal);
  const remove = difference(previousNames, currentNames);
  return { create, update, remove, normal };
}

```

It just returns an object with well thought out lists of changes.

### rsend At Depth

The focus is on the local .checksum.json there will be a remote copy,
this will be created when the data is uploaded somewhere; but that is just an old copy we use.

The program always makes the local version,
always makes sure that .checksum.json is up-to-date.

### Shenanigans

Some shenanigans are allowed, for example we can create a remote version based on remote files, if it ever gets deleted.
We can perform remote tests based on number of bytes alone, this will discover most of corrupt/truncated files.
But these shenanigans emerge out of the clever simplicity of this program.
The focus is always on the local files and the local copy of .checksum.json.

## rsend does not actually transfer files

It would be an insult for me to select a mode of transfer for you,
rsend creates the lftp/sftp or even send.sh/send.bat files.

Personally, I am interested in creating .tar files (similar to .zip),
and uploading those to the remote destination, and then unpacking them there via a shell command.

This is simple, because I can just create a doit.sh that not only will contain the tar and upload instructions,
but also a way to login to the remote server, and un-tar that file.

rsend follows the "do one thing do it well" philosophy.


### TODO

- remove directories emptied by .remove