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

npm run test

```
