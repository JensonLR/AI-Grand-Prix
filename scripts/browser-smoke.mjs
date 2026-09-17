/* global document, HTMLCanvasElement, innerWidth, innerHeight, getComputedStyle, Event */
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});

function collectErrors(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
  return errors;
}

async function waitForRuntime(page){
  const response=await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw new Error(`site returned ${response?.status()??'no response'}`);
  // Chromium 143/Playwright 1.57 can time out in waitForSelector even after its
  // call log says the canvas resolved visible on a high-DPR mobile page. Use the
  // browser DOM itself as the release oracle for all runtime readiness checks.
  await page.waitForFunction(()=>document.querySelector('.viewport canvas') instanceof HTMLCanvasElement,{timeout:30000,polling:100});
  await page.waitForFunction(()=>document.documentElement.dataset.agpScene==='ready',{timeout:30000,polling:100});
  await page.waitForFunction(()=>document.documentElement.dataset.agpBanc==='v888:188508:11752828',{timeout:120000,polling:100});
  await page.waitForFunction(()=>document.documentElement.dataset.agpCar==='agp01',{timeout:30000,polling:100});
  await page.waitForFunction(()=>['premium','balanced'].includes(document.documentElement.dataset.agpVisual??''),{timeout:30000,polling:100});
}

async function enterArchive(page){
  await page.locator('.opening-primary').click();
  await page.waitForFunction(()=>document.querySelector('.paddock-v2')!==null,{timeout:15000,polling:100});
  const archive=page.getByRole('button',{name:/RACE ARCHIVE/i});
  await archive.click({noWaitAfter:true});
  await page.waitForFunction(()=>document.querySelector('.screen-race .cwc-broadcast')!==null,{timeout:30000,polling:100});
  await page.waitForFunction(()=>{
    const el=document.querySelector('.screen-race .cwc-broadcast');
    if(!el)return false;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';
  },{timeout:15000,polling:100});
}

try{
  const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const desktopErrors=collectErrors(desktop);
  await waitForRuntime(desktop);
  await desktop.waitForTimeout(700);
  const desktopSnapshot=await desktop.evaluate(()=>{
    const canvas=document.querySelector('.viewport canvas'),rect=canvas?.getBoundingClientRect();
    return{scene:document.documentElement.dataset.agpScene,banc:document.documentElement.dataset.agpBanc,car:document.documentElement.dataset.agpCar,visual:document.documentElement.dataset.agpVisual,canvasWidth:rect?.width??0,canvasHeight:rect?.height??0,backingWidth:canvas instanceof HTMLCanvasElement?canvas.width:0,backingHeight:canvas instanceof HTMLCanvasElement?canvas.height:0,titleText:document.body.innerText.includes('THE GRID IS'),blackFallback:document.querySelector('.visual-fallback')!==null};
  });
  if(desktopSnapshot.scene!=='ready')throw new Error(`scene readiness is ${desktopSnapshot.scene}`);
  if(desktopSnapshot.banc!=='v888:188508:11752828')throw new Error(`BANC readiness is ${desktopSnapshot.banc}`);
  if(desktopSnapshot.car!=='agp01')throw new Error(`approved AGP-01 car did not become active: ${desktopSnapshot.car}`);
  if(desktopSnapshot.visual!=='premium')throw new Error(`desktop premium visual tier did not activate: ${desktopSnapshot.visual}`);
  if(desktopSnapshot.canvasWidth<900||desktopSnapshot.canvasHeight<500||desktopSnapshot.backingWidth<900||desktopSnapshot.backingHeight<500)throw new Error(`race canvas is not full-size: ${JSON.stringify(desktopSnapshot)}`);
  if(!desktopSnapshot.titleText)throw new Error('2027 opening title is absent');
  if(desktopSnapshot.blackFallback)throw new Error('3D fallback is active instead of the live race scene');
  if(desktopErrors.length)throw new Error(`desktop browser emitted runtime errors:\n${desktopErrors.join('\n')}`);

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const mobileErrors=collectErrors(mobile);
  await waitForRuntime(mobile);
  await enterArchive(mobile);
  await mobile.waitForTimeout(900);
  const mobileSnapshot=await mobile.evaluate(()=>{
    const rectOf=selector=>document.querySelector(selector)?.getBoundingClientRect(),canvas=document.querySelector('.viewport canvas'),canvasRect=canvas?.getBoundingClientRect(),racebar=rectOf('.cwc-broadcast .racebar'),tower=rectOf('.cwc-broadcast .tower'),dock=rectOf('.cwc-broadcast .camera-bar'),focus=rectOf('.cwc-broadcast .focus-card'),telemetry=rectOf('.cwc-broadcast .telemetry'),mini=document.querySelector('.cwc-broadcast .track-mini, .cwc-broadcast .mini-map'),firstCamera=document.querySelector('.cwc-broadcast .camera-bar button')?.getBoundingClientRect(),visibleDrivers=[...document.querySelectorAll('.cwc-broadcast .tower .driver')].filter(el=>getComputedStyle(el).display!=='none').length;
    return{width:innerWidth,height:innerHeight,car:document.documentElement.dataset.agpCar,visual:document.documentElement.dataset.agpVisual,race:document.querySelector('.screen-race .cwc-broadcast')!==null,canvasWidth:canvasRect?.width??0,canvasHeight:canvasRect?.height??0,backingWidth:canvas instanceof HTMLCanvasElement?canvas.width:0,backingHeight:canvas instanceof HTMLCanvasElement?canvas.height:0,bodyScrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),racebar:racebar?{left:racebar.left,right:racebar.right,top:racebar.top,bottom:racebar.bottom,width:racebar.width}:null,tower:tower?{left:tower.left,right:tower.right,top:tower.top,bottom:tower.bottom,width:tower.width,height:tower.height}:null,dock:dock?{left:dock.left,right:dock.right,top:dock.top,bottom:dock.bottom,width:dock.width,height:dock.height}:null,focus:focus?{left:focus.left,right:focus.right,top:focus.top,bottom:focus.bottom,width:focus.width}:null,telemetry:telemetry?{left:telemetry.left,right:telemetry.right,top:telemetry.top,bottom:telemetry.bottom,width:telemetry.width}:null,miniDisplay:mini?getComputedStyle(mini).display:'absent',firstCameraHeight:firstCamera?.height??0,visibleDrivers};
  });
  if(mobileSnapshot.car!=='agp01')throw new Error(`mobile did not render AGP-01: ${mobileSnapshot.car}`);
  if(mobileSnapshot.visual!=='premium')throw new Error(`capable mobile did not activate premium visual tier: ${mobileSnapshot.visual}`);
  if(!mobileSnapshot.race)throw new Error('mobile archive did not enter the race presentation');
  if(mobileSnapshot.canvasWidth<388||mobileSnapshot.canvasHeight<840)throw new Error(`mobile race canvas is undersized: ${JSON.stringify(mobileSnapshot)}`);
  if(mobileSnapshot.backingWidth<600||mobileSnapshot.backingHeight<1200)throw new Error(`mobile renderer is still low-resolution: ${JSON.stringify(mobileSnapshot)}`);
  if(mobileSnapshot.bodyScrollWidth>mobileSnapshot.width+2)throw new Error(`mobile page overflows horizontally: ${JSON.stringify(mobileSnapshot)}`);
  for(const [name,rect] of [['racebar',mobileSnapshot.racebar],['tower',mobileSnapshot.tower],['dock',mobileSnapshot.dock],['focus',mobileSnapshot.focus],['telemetry',mobileSnapshot.telemetry]]){if(!rect)throw new Error(`mobile ${name} is missing`);if(rect.left<-1||rect.right>mobileSnapshot.width+1)throw new Error(`mobile ${name} escapes viewport: ${JSON.stringify(rect)}`);}
  if(mobileSnapshot.racebar.width<356)throw new Error(`mobile race ribbon is unexpectedly narrow: ${mobileSnapshot.racebar.width}`);
  if(mobileSnapshot.tower.width>170||mobileSnapshot.tower.height>215)throw new Error(`mobile timing tower obstructs too much of the race: ${JSON.stringify(mobileSnapshot.tower)}`);
  if(mobileSnapshot.visibleDrivers<5||mobileSnapshot.visibleDrivers>7)throw new Error(`mobile tower should show a concise 5–7 driver story: ${mobileSnapshot.visibleDrivers}`);
  if(mobileSnapshot.focus.top<mobileSnapshot.tower.bottom-2)throw new Error(`focus card overlaps timing tower: ${JSON.stringify(mobileSnapshot)}`);
  if(mobileSnapshot.dock.bottom>mobileSnapshot.height+1||mobileSnapshot.dock.height<48)throw new Error(`mobile camera dock is not thumb-safe: ${JSON.stringify(mobileSnapshot.dock)}`);
  if(mobileSnapshot.firstCameraHeight<38)throw new Error(`mobile camera target is too small: ${mobileSnapshot.firstCameraHeight}px`);
  if(!['none','absent'].includes(mobileSnapshot.miniDisplay))throw new Error(`desktop mini-map remains visible on phone: ${mobileSnapshot.miniDisplay}`);

  const range=mobile.locator('.replay-controls input[type="range"]');
  if(await range.count()){
    await range.evaluate(input=>{const el=input;el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
    await mobile.waitForFunction(()=>document.querySelector('.results.has-podium')!==null,{timeout:15000,polling:100});
    await mobile.waitForTimeout(250);
    const results=await mobile.evaluate(()=>{const rect=selector=>document.querySelector(selector)?.getBoundingClientRect(),sheet=rect('.results.has-podium'),title=rect('.results-title'),podium=rect('.podium-ceremony'),list=rect('.results-list'),actions=rect('.results-actions'),dock=document.querySelector('.camera-bar');return{sheet,title,podium,list,actions,dockDisplay:dock?getComputedStyle(dock).display:'none'};});
    if(!results.sheet||!results.title||!results.podium||!results.list||!results.actions)throw new Error(`results screen is missing a required region: ${JSON.stringify(results)}`);
    if(results.title.bottom>results.podium.top+2)throw new Error(`results title overlaps podium: ${JSON.stringify(results)}`);
    if(results.podium.bottom>results.list.bottom+2)throw new Error(`podium escapes the classification flow: ${JSON.stringify(results)}`);
    if(results.actions.top<results.list.top)throw new Error(`results actions overlap the classification: ${JSON.stringify(results)}`);
    if(results.dockDisplay!=='none')throw new Error('camera dock remains visible behind mobile results');
  }
  if(mobileErrors.length)throw new Error(`mobile browser emitted runtime errors:\n${mobileErrors.join('\n')}`);
  console.log(`Experience V4 smoke passed: AGP-01 + premium renderer, ${desktopSnapshot.banc}; mobile ${mobileSnapshot.width}x${mobileSnapshot.height} HUD contained, ${mobileSnapshot.visibleDrivers} timing rows, dedicated results screen.`);
}finally{await browser.close();}
