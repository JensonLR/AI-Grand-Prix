import { readFile,writeFile } from 'node:fs/promises';

const file='apps/web/src/PremiumCar.ts';
const before=await readFile(file,'utf8');
const after=before
  .replaceAll('front?.405:.445','front ? .405 : .445')
  .replaceAll('front?.34:.405','front ? .34 : .405')
  .replaceAll('e.number%2?.32:.25','e.number%2 ? .32 : .25');
if(after!==before){await writeFile(file,after);console.log('Normalised AGP-27 premium car source.');}
else console.log('AGP-27 premium car source already normalised.');
