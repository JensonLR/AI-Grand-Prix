const CACHE='agp-cwc-v888-2027-v3-premium-mobile';
const STATIC=/\.(?:js|css|woff2?|glb|svg|png|webp|json|u8|u16|u32|txt)$/i;
const BANC='/connectome/banc-v888-full/';
const sw=globalThis,cacheApi=globalThis.caches;

sw.addEventListener('install',event=>{event.waitUntil(sw.skipWaiting())});
sw.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await cacheApi.keys())if(key.startsWith('agp-cwc-')&&key!==CACHE)await cacheApi.delete(key);await sw.clients.claim()})())});

async function remember(request,response){
  if(!response||!response.ok)return response;
  try{const cache=await cacheApi.open(CACHE);await cache.put(request,response.clone())}catch(error){void error}
  return response;
}

async function cacheFirst(request){
  const cached=await cacheApi.match(request);
  if(cached){fetch(request).then(response=>remember(request,response)).catch(error=>{void error});return cached;}
  return remember(request,await fetch(request));
}

async function networkFirst(request){
  try{return await remember(request,await fetch(request))}catch(error){const cached=await cacheApi.match(request);if(cached)return cached;throw error;}
}

sw.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==sw.location.origin)return;
  const relative=url.pathname;
  if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}
  // The connectome binaries are immutable and large, so keep them cache-first. Presentation
  // assets are network-first to prevent an iPhone/PWA from pinning an obsolete car or UI.
  if(relative.includes(BANC)){event.respondWith(cacheFirst(request));return;}
  if(STATIC.test(relative))event.respondWith(networkFirst(request));
});
