# rsend
Upload local files to remote host via scp and ssh.

This is alpha software not to be used in production.

While it has been tested, and is in daily use, it still needs a full unit test suite,
if you wish to volunteer please contact the author, or submit a PR.

Please note, that in the alpha phase you need to ssh-copy-id prior to using a host.

## Installation

```shell
npm i rsend
```

## Usage

```JavaScript
import rsend from 'rsend';
```

## Example

```JavaScript
import rsend from 'rsend';


// where test is a directory.
await rsend('test', 'earth:/tmp/test');

```

## Testing

```shell

env DEBUG=upload npm run test


> rsend@1.0.2 test
> ./test.js

  upload Local shasum: test/SHA256SUM +0ms
  upload Executing: ssh "earth" "test -d /tmp/rsend-test || echo fail"; +1ms
  upload Directory /tmp/rsend-test is missing creating a blank one. +546ms
  upload Executing: ssh "earth" "mkdir -p /tmp/rsend-test"; +1ms
  upload Executing: ssh "earth" "test -f /tmp/rsend-test/SHA256SUM || echo fail"; +304ms
  upload Checksum file missing in /tmp/rsend-test creating a new blank one. +330ms
  upload Executing: ssh "earth" "sha256sum /tmp/rsend-test/*.* || echo "" > /tmp/rsend-test/SHA256SUM"; +0ms
  upload Executing: ssh "earth" "cat /tmp/rsend-test/SHA256SUM"; +288ms
  upload Number of files in current list: 1 +233ms
  upload Files shared between previous list and current list: 0 +1ms
  upload Number of files needing to be uploaded: 1 +0ms
  upload Executing: ssh "earth" "ls -1 /tmp/rsend-test/*.* || echo"; +0ms
  upload Skipping 0 files. +236ms
  upload Copyinig 1 new files and checksum to remote device. +0ms
  upload Executing: scp "test/a.txt" "test/SHA256SUM" "earth:/tmp/rsend-test"; +0ms



env DEBUG=upload npm run test


> rsend@1.0.2 test
> ./test.js

  upload Local shasum: test/SHA256SUM +0ms
  upload Executing: ssh "earth" "test -d /tmp/rsend-test || echo fail"; +1ms
  upload Directory /tmp/rsend-test is missing creating a blank one. +546ms
  upload Executing: ssh "earth" "mkdir -p /tmp/rsend-test"; +1ms
  upload Executing: ssh "earth" "test -f /tmp/rsend-test/SHA256SUM || echo fail"; +304ms
  upload Checksum file missing in /tmp/rsend-test creating a new blank one. +330ms
  upload Executing: ssh "earth" "sha256sum /tmp/rsend-test/*.* || echo "" > /tmp/rsend-test/SHA256SUM"; +0ms
  upload Executing: ssh "earth" "cat /tmp/rsend-test/SHA256SUM"; +288ms
  upload Number of files in current list: 1 +233ms
  upload Files shared between previous list and current list: 0 +1ms
  upload Number of files needing to be uploaded: 1 +0ms
  upload Executing: ssh "earth" "ls -1 /tmp/rsend-test/*.* || echo"; +0ms
  upload Skipping 0 files. +236ms
  upload Copyinig 1 new files and checksum to remote device. +0ms
  upload Executing: scp "test/a.txt" "test/SHA256SUM" "earth:/tmp/rsend-test"; +0ms


```
