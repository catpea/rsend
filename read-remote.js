import Url from 'url-parse'; // a more tolerant URL
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';
export default async function readRemote(location){
  try{
    return (new Url(location)).protocol.startsWith('http')
    ?(await (await fetch(location))).text()
    :await readFile(location, 'utf8');
  }catch{
    return null;
  }
}
