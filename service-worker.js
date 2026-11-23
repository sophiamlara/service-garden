'use strict';
// ABA Track live scope. Network-first so refresh displays newly deployed versions;
// offline cache preserves the UI, never caches cloud requests or private data.
const CACHE='service-garden-v044-shell-2';
const FILES=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const cache=await caches.open(CACHE);await cache.addAll(FILES);await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(x=>x.startsWith('service-garden-')&&x!==CACHE).map(x=>caches.delete(x)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL('./',self.registration.scope).pathname))return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const res=await fetch(e.request);if(res.ok)await cache.put(e.request,res.clone());return res;}
  catch{const cached=await cache.match(e.request,{ignoreSearch:true});if(cached)return cached;
   if(e.request.mode==='navigate'){const fallback=await cache.match('./index.html');if(fallback)return fallback;}
   throw Error('Offline page not cached.');}
 })());
});
