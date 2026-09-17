const CACHE='agp-cwc-v888-2027-v2';
const STATIC=/\.(?:js|css|woff2?|glb|svg|png|webp|json|u8|u16|u32|txt)$/i;
const BANC='/connectome/banc-v888-full/';

self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('agp-cwc-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})())});

async function remember(request,response){
  if(!response||!response.ok)return response;
  try{const cache=await caches.open(CACHE);await cache.put(request,response.clone())}catch{}
  return response;
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached){fetch(request).then(response=>remember(request,response)).catch(()=>{});return cached;}
  return remember(request,await fetch(request));
}

async function networkFirst(request){
  try{return await remember(request,await fetch(request))}catch(error){const cached=await caches.match(request);if(cached)return cached;throw error;}
}

self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  const relative=url.pathname;
  if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}
  if(relative.includes(BANC)||STATIC.test(relative))event.respondWith(cacheFirst(request));
});
