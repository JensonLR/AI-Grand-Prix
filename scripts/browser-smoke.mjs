import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
page.on('console',message=>{if(message.type()==='error')pageErrors.push(`console: ${message.text()}`);});

try{
  const response=await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw new Error(`site returned ${response?.status()??'no response'}`);
  await page.waitForSelector('.viewport canvas',{state:'attached',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.agpScene==='ready',{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.agpBanc==='v888:188508:11752828',{timeout:120000});
  await page.waitForTimeout(1200);
  const snapshot=await page.evaluate(()=>{
    const canvas=document.querySelector('.viewport canvas');
    const rect=canvas?.getBoundingClientRect();
    return{
      scene:document.documentElement.dataset.agpScene,
      banc:document.documentElement.dataset.agpBanc,
      canvasWidth:rect?.width??0,
      canvasHeight:rect?.height??0,
      backingWidth:canvas instanceof HTMLCanvasElement?canvas.width:0,
      backingHeight:canvas instanceof HTMLCanvasElement?canvas.height:0,
      titleText:document.body.innerText.includes('THE GRID IS'),
      blackFallback:document.querySelector('.visual-fallback')!==null
    };
  });
  if(snapshot.scene!=='ready')throw new Error(`scene readiness is ${snapshot.scene}`);
  if(snapshot.banc!=='v888:188508:11752828')throw new Error(`BANC readiness is ${snapshot.banc}`);
  if(snapshot.canvasWidth<900||snapshot.canvasHeight<500||snapshot.backingWidth<900||snapshot.backingHeight<500)throw new Error(`race canvas is not full-size: ${JSON.stringify(snapshot)}`);
  if(!snapshot.titleText)throw new Error('2027 opening title is absent');
  if(snapshot.blackFallback)throw new Error('3D fallback is active instead of the live race scene');
  if(pageErrors.length)throw new Error(`browser emitted runtime errors:\n${pageErrors.join('\n')}`);
  console.log(`Browser smoke passed: ${Math.round(snapshot.canvasWidth)}x${Math.round(snapshot.canvasHeight)} live canvas; ${snapshot.banc}; Bahrain attract scene ready.`);
}finally{
  await browser.close();
}
