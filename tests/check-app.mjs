import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('all embedded application scripts parse',()=>{
 const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(blocks.length>=3,'expected app scripts');
 for(const [i,block] of blocks.entries())assert.doesNotThrow(()=>new vm.Script(block[1],{filename:'inline-'+i+'.js'}));
});
test('single application version',()=>{
 assert.match(html,/<title>Service Garden — v0\.4<\/title>/);
 assert.match(html,/id="app-version"[^>]*>v0\.4/);
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
 assert.equal(m.short_name,'Service Garden');
 assert.equal(m.display,'standalone');
});
