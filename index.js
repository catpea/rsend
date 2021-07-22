import path from 'path';
import execa from 'execa';
import debug from 'debug';
import sha256sum from 'sha256sum';
const log = debug('upload');
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import {difference, differenceBy, intersectionBy} from 'lodash-es';
//
export default rsend;

async function rsend(localDirectory, remoteDestination, {shasumFile, clean}={shasumFile:'SHA256SUM', clean:false}){

  const [remoteHost, remoteDirectory] = remoteDestination.split(':');
  const localShasum = path.resolve( path.join(localDirectory, shasumFile) );
  if (!existsSync(localShasum)) {
    const currentChecksums = (await sha256sum(localDirectory + '/*.*')).map(([sum, file])=>[sum, path.basename(file)]);
    await writeFile(localShasum, currentChecksums.map(([sum,file])=>`${sum}  ${file}`).join('\n'));
  }
  console.log(`Local shasum: ${localShasum}`);

  const directoryMissing = (await exec("ssh", [ remoteHost, `test -d ${remoteDirectory} || echo fail`])).stdout=='fail'?true:false;
  if(directoryMissing){
    log(`Directory ${remoteDirectory} is missing creating a blank one.`);
    await exec("ssh", [ remoteHost, `mkdir -p ${remoteDirectory}`]);
  }

  const checksumMissing = (await exec("ssh", [ remoteHost, `test -f ${path.join(remoteDirectory, shasumFile)} || echo fail`])).stdout=='fail'?true:false;
  if(checksumMissing){
    log(`Checksum file missing in ${remoteDirectory} creating blank one.`);
    await exec("ssh", [ remoteHost, `sha256sum *.* > ${path.join(remoteDirectory, shasumFile )}`]);
  }

  const previousChecksums = (await exec("ssh",[remoteHost, `cat ${path.join(remoteDirectory, shasumFile)}`])).stdout.split("\n").map(l=>l.split('  '));
  const currentChecksums = (await readFile(localShasum)).toString().split("\n").map(l=>l.split('  '));
  log(`Number of files in current playlist: ${currentChecksums.length}`);
  const expiredChecksums = differenceBy(previousChecksums, currentChecksums, o=>o.join('  '));
  const duplicateChecksums = intersectionBy(previousChecksums, currentChecksums, o=>o.join('  '));
  log(`Files shared between previous playlist and current playlist: ${duplicateChecksums.length}`);
  const neededChecksums = differenceBy(currentChecksums, duplicateChecksums, o=>o.join('  '));
  log(`Number of files needing to be uploaded: ${neededChecksums.length}`);
  const expiredFiles = expiredChecksums.map(i=>i[1]);
  const neededFiles = neededChecksums.map(i=>i[1]);
  const duplicateFiles = duplicateChecksums.map(i=>i[1]);

  // OP: DELETE
  const filesNeedDeletion = (expiredFiles.length > 0);
  if(filesNeedDeletion){
    if(clean){
      log(`Deleting ${expiredFiles.length} file${expiredFiles==1?'':'s'} from ${remoteDirectory}.`);
      await exec("ssh", [remoteHost, "rm " + expiredFiles.map(i=>`"${remoteDirectory}/${i}"`).join(' ')]);
    }else{
      log(`Discovered ${expiredFiles.length} files${expiredFiles.length==1?'':'s'} that require${expiredFiles.length==1?'s':''} deletion use --clean to remove ${expiredFiles.length==1?'it':'them'}.`);
    }
  }

  let existingFiles = (await exec("ssh", [ remoteHost, `ls -1 ${remoteDirectory}/*.mp3 || echo`, ])).stdout.split('\n').map(i=>i.trim()).filter(i=>i).map(i=>path.basename(i));
  const expectFiles = intersectionBy(previousChecksums, currentChecksums, o=>o.join('  ')).map(i=>i[1]); // expected to exist after delete
  const leftoverFiles = difference(existingFiles, expectFiles);

  const discoveredLeftovers = (leftoverFiles.length > 0);
  if(discoveredLeftovers){
    if(clean){
      log(`Discovered ${leftoverFiles.length} leftover${leftoverFiles.length==1?'':'s'} that will now be removed.`);
      await exec("ssh", [remoteHost, "rm " + leftoverFiles.map(i=>`"${remoteDirectory}/${i}"`).join(' ')]);
    }else{
      log(`Discovered ${leftoverFiles.length} leftover${leftoverFiles.length==1?'':'s'} use --clean to remove ${leftoverFiles.length==1?'it':'them'}.`);
    }
  }

  // OP: COPY
  log(`Skipping ${duplicateFiles.length} file${duplicateFiles.length==1?'':'s'}.`);
  log(`Copyinig ${neededFiles.length} new file${duplicateFiles.length==1?'':'s'} and checksum to remote device.`);

  const transferRequired = (neededFiles.length > 0);
  if(transferRequired){
      await exec("scp", [...neededFiles.map(i=>path.join(localDirectory,i)), localShasum, remoteDestination]);
  }

  return true;
}

async function exec(command, argument, options){
  log(`Executing: ${command} ${ Array.isArray(argument)?argument.map(i=>`"${i}"`).join(' '):argument};`);
  return await execa(command, argument, options);
}
