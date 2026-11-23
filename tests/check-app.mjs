import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('all embedded application scripts parse',()=>{
 const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(blocks.length>=3,'expected app scripts');
 for(const [i,block] of blocks.entries())assert.doesNotThrow(()=>new vm.Script(block[1],{filename:'inline-'+i+'.js'}));
});
test('single application version',()=>{
 assert.match(html,/<title>ABA Track — v1\.0<\/title>/);
 assert.match(html,/id="app-version"[^>]*>v1\.0/);
 assert.doesNotMatch(html,/href="\.?\/beta\/|v0\.3 beta/i);
});
test('management controls exist',()=>{
 for(const id of ['client-manage-dialog','client-manage-code','client-rename','client-archive-toggle','client-backup','client-backup-ack','client-delete-confirm','client-permanent-delete','archived-clients-dialog'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/function initializeClientManagement/);
 assert.match(html,/function clientIsArchived/);
 assert.match(html,/Client and linked records deleted/);
});
test('celebration and empty screens are present',()=>{
 assert.match(html,/Congratulations!/);
 assert.match(html,/garden-achievement/);
 assert.match(html,/A fresh page for your next session/);
 assert.match(html,/Your garden is ready to grow!/);
});
test('sync configuration and storage identifiers are unchanged',()=>{
 for(const key of ['garden_pair','garden_pull','garden_push','garden_revoke_device','garden_list_devices','service-garden-v03-beta-safe-v1'])assert.ok(html.includes(key),key);
 assert.doesNotMatch(html,/sb_secret_|service_role\s*[:=]/);
});
test('home screen metadata targets main application',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(m.id,'/service-garden/');
 assert.equal(m.short_name,'ABA Track');
 assert.equal(m.display,'standalone');
});

test('sync state labels and conflict decision UI',()=>{
 for(const state of ['offline','checking','syncing','synced','error','conflict']) assert.match(html,new RegExp(state+":'"));
 for(const id of ['garden-conflict-panel','garden-conflict-counts','garden-conflict-diff','export-local-conflict','export-cloud-dialog','garden-apply-conflict','garden-conflict-ack'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/function gardenShowConflict\(/);
 assert.match(html,/gardenShowConflict\(\);return;/);
 assert.match(html,/gardenResolveConflict\(selected==='local'\)/);
});

test('comparison shows real field differences without choosing automatically',()=>{
 assert.match(html,/function gardenDiffRows\(/);
 assert.match(html,/item\.fields/);
 assert.match(html,/gardenDiffValue\(item\.l\?\.\[field\]\)/);
 assert.match(html,/gardenDiffValue\(item\.r\?\.\[field\]\)/);
 assert.match(html,/garden-conflict-choice/);
 assert.match(html,/garden-conflict-ack/);
 assert.match(html,/disabled>Confirm version and resume sync/);
 assert.doesNotMatch(html,/\$\('export-cloud'\)/);
});

test('conflicting record disclosure defaults open but supports multiple records',()=>{
 assert.match(html,/if\(index===0\)details\.open=true/);
 assert.match(html,/View differences/);
 assert.match(html,/Hide details/);
 assert.match(html,/gardenRenderedConflictSignature/);
 assert.match(html,/garden-diff-item/);
 assert.match(html,/garden-diff-heading/);
});
test('mobile conflict controls have compact, fixed-size radios and checkbox',()=>{
 assert.match(html,/garden-conflict-decision input\[type="radio"\]/);
 assert.match(html,/width:20px!important/);
 assert.match(html,/garden-conflict-ack input\[type="checkbox"\]/);
 assert.match(html,/garden-apply-conflict\{width:100%/);
});

test('ABA Track branding preserves installed app identity',()=>{
 assert.match(html,/apple-mobile-web-app-title" content="ABA Track"/);
 assert.match(html,/<div>ABA Track<small>/);
 assert.doesNotMatch(html,/<title>Service Garden/);
 const m=JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(m.id,'/service-garden/');
 assert.equal(m.name,'ABA Track');
});

test('Duo portrait and landscape session log cards keep every field and action',()=>{
 assert.match(html,/@media\(max-width:1250px\)/);
 assert.match(html,/#logs \.session-table tbody tr/);
 assert.match(html,/grid-template-areas:"date time" "period period" "contact modality" "provider actions"/);
 assert.match(html,/grid-template-areas:"date time" "period period" "contact modality" "provider provider" "actions actions"/);
 assert.match(html,/#logs \.scroll\{overflow:visible/);
 assert.match(html,/cell\.dataset\.label = head\.cells\[i\]\.textContent/);
 for(const label of ['Session date','Authorization period','Time logged','Contact','Delivery method','Provider','Actions']) assert.ok(html.includes("'"+label+"'"));
});

test('stable v1.0 release is consistent across UI',()=>{
 assert.match(html,/<title>ABA Track — v1\.0<\/title>/);
 assert.match(html,/aria-label="Version 1\.0">v1\.0/);
 assert.match(html,/class="app-version">v1\.0/);
 assert.doesNotMatch(html,/v0\.4\.5/);
});

test('ABA Track flower logo is consistently referenced in home screen, tab and sidebar',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 assert.match(html,/apple-touch-icon\.png\?brand=aba-track-1/);
 assert.match(html,/icon-192\.png\?brand=aba-track-tabs-3/);
 assert.match(html,/favicon\.svg\?brand=aba-track-tabs-3/);
 assert.match(html,/safari-pinned-tab\.svg\?brand=aba-track-tabs-2/);
 assert.match(html,/class="brand-icon brand-icon-image" src="\.\/icon-192\.png\?brand=aba-track-1"/);
 assert.equal(manifest.name,'ABA Track');
 assert.equal(manifest.id,'/service-garden/');
 assert.equal(manifest.icons.length,2);
 assert.ok(manifest.icons.every(icon=>icon.src.includes('brand=aba-track-1')));
});
test('all logo PNG images are nonblank valid RGBA files with expected dimensions',()=>{
 for(const [filename,n] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){
  const bytes=fs.readFileSync(new URL('../'+filename,import.meta.url));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),n);
  assert.equal(bytes.readUInt32BE(20),n);
  assert.equal(bytes[24],8);
  assert.equal(bytes[25],6);
  let offset=8,idat=[];
  while(offset+12<=bytes.length){
   const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
   if(type==='IDAT')idat.push(bytes.subarray(offset+8,offset+8+length));
   offset+=12+length;
   if(type==='IEND')break;
  }
  const pixels=zlib.inflateSync(Buffer.concat(idat));assert.equal(pixels.length,n*(1+n*4));
  const midpoint=Math.floor(n/2),p=(midpoint*(n*4+1))+1+midpoint*4;
  assert.ok(pixels[p+3]>200,'center flower is visible');
  assert.ok(pixels[p]<200,'gold flower is darker than its background');
 }
});

test('Safari tab assets use valid SVG and include a monochrome pinned-tab icon',()=>{
 const svg=fs.readFileSync(new URL('../favicon.svg',import.meta.url),'utf8');
 const mask=fs.readFileSync(new URL('../safari-pinned-tab.svg',import.meta.url),'utf8');
 assert.match(svg,/<svg[^>]+viewBox="0 0 512 512"/);
 assert.match(svg,/fill="#956F2B"/);
 assert.match(mask,/<svg[^>]+viewBox="0 0 512 512"/);
 assert.match(mask,/fill="black"/);
 assert.doesNotMatch(mask,/<rect/);
});

test('Safari favicon.ico offers three recognized small icon dimensions',()=>{
 assert.match(html,/rel="icon" href="\.\/favicon\.ico\?brand=aba-track-tabs-3" type="image\/x-icon"/);
 const ico=fs.readFileSync(new URL('../favicon.ico',import.meta.url));
 assert.equal(ico.readUInt16LE(0),0);assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
 const dimensions=[16,32,48];for(let i=0;i<3;i++){
  const p=6+i*16;assert.equal(ico[p],dimensions[i]);assert.equal(ico[p+1],dimensions[i]);
  const count=ico.readUInt32LE(p+8),offset=ico.readUInt32LE(p+12);
  assert.ok(count>100);assert.ok(offset+count<=ico.length);
 }
});
