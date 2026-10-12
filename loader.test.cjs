const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const code=fs.readFileSync(__dirname+'/loader-boot.js','utf8');
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}};
function boot(sessionStorage,preview=false){
  const classes=new Set(),timers=[];let removed=false;
  const inertNode={inert:true,removeAttribute(){}};
  const document={documentElement:{hasAttribute:()=>preview,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},getElementById:()=>({remove:()=>removed=true}),querySelectorAll:()=>[inertNode]};
  vm.runInNewContext(code,{sessionStorage,document,window:{},setTimeout:fn=>{timers.push(fn);return 1}});
  return {classes,timers,inertNode,isRemoved:()=>removed};
}
test('intro plays once in one tab, including a refresh before it finishes',()=>{
  const session=memory();
  assert.equal(boot(session).classes.has('intro-pending'),true);
  assert.equal(boot(session).classes.has('intro-pending'),false);
});
test('a newly opened browser tab or window receives its own intro',()=>{
  const firstSession=memory(),newSession=memory();
  assert.equal(boot(firstSession).classes.size,1);
  assert.equal(boot(firstSession).classes.size,0);
  assert.equal(boot(newSession).classes.size,1);
});
test('replay page never consumes or resets the real store first visit',()=>{
  const session=memory();
  assert.equal(boot(session,true).classes.size,1);
  assert.equal(session.getItem('zurbez:intro-seen:v3'),undefined);
  assert.equal(boot(session).classes.size,1);
  assert.equal(boot(session,true).classes.size,1);
  assert.equal(boot(session).classes.size,0);
});
test('watchdog unblocks content if the animation script fails',()=>{
  const page=boot(memory());page.timers[0]();
  assert.equal(page.classes.size,0);assert.equal(page.inertNode.inert,false);assert.equal(page.isRemoved(),true);
});
test('unavailable storage never crashes the storefront',()=>{
  const blocked={getItem(){throw Error()},setItem(){throw Error()}};
  assert.equal(boot(blocked).classes.size,1);
});
