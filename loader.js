(() => {
  'use strict';
  const root = document.documentElement;
  const overlay = document.getElementById('zurbez-intro');
  if (!overlay) return;
  if (!root.classList.contains('intro-pending')) { overlay.remove(); return; }
  const words = [...overlay.querySelectorAll('.intro-word')];
  const artwork = overlay.querySelector('.intro-artwork');
  const counter = overlay.querySelector('.intro-counter');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = new Set();
  const animations = new Set();
  let disposed = false, frame = 0, current = null;
  const siblings = [...document.body.children].filter(el => el !== overlay && !['SCRIPT','STYLE'].includes(el.tagName) && !el.inert);
  siblings.forEach(el => { el.inert = true; el.setAttribute('data-intro-inert',''); });
  const later = (fn, ms) => { const id=setTimeout(() => { timers.delete(id); if(!disposed) fn(); },ms); timers.add(id); return id; };
  function tween(el, frames, duration, delay=0, easing='cubic-bezier(.76,0,.24,1)') {
    const anim=el.animate(frames,{duration,delay,easing,fill:'forwards'});
    animations.add(anim);
    return anim;
  }
  function cleanup() {
    if(disposed) return;
    disposed=true;
    timers.forEach(clearTimeout);
    animations.forEach(a=>a.cancel());
    cancelAnimationFrame(frame);
    clearTimeout(window.zurbezIntroWatchdog);
    root.classList.remove('intro-pending');
    siblings.forEach(el=>{el.inert=false;el.removeAttribute('data-intro-inert');});
    overlay.remove();
    window.removeEventListener('pagehide',cleanup);
    if (root.hasAttribute('data-intro-preview')) {
      try { sessionStorage.setItem('zurbez:intro-seen:v3','1'); } catch {}
      location.replace('index.html');
    }
  }
  overlay.querySelector('.intro-skip').addEventListener('click',cleanup);
  window.addEventListener('pagehide',cleanup,{once:true});
  // Load only on the first visit. Repeat visits do not download the intro art.
  const images = Array.from({length:6},(_,i)=> {
    const img=new Image(); img.alt=''; img.decoding='async';
    img.src=`assets/zurbez/artwork-${i+1}.png`;
    artwork.append(img); return img;
  });
  const ready = img => new Promise(resolve => {
    if(img.complete) return resolve(img.naturalWidth>0?img:null);
    img.onload=()=>resolve(img); img.onerror=()=>resolve(null);
  });
  function countdown(start) {
    if(disposed) return;
    const p=Math.min((performance.now()-start)/6667,1);
    const ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
    counter.textContent=String(Math.round(100*(1-ease))).padStart(3,'0');
    if(p<1) frame=requestAnimationFrame(()=>countdown(start));
  }
  function finish() {
    if(current) tween(current,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(0)'}],600,500);
    tween(artwork,[{width:getComputedStyle(artwork).width},{width:'0px'}],800,600);
    later(()=> {
      counter.textContent='000';
      tween(counter,[{opacity:1},{opacity:0}],500);
      words.forEach(word=>tween(word,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(120%)'}],1000));
      tween(overlay,[{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 100% 0)'}],1800);
      later(cleanup,1800);
    },1400);
  }
  function run(available) {
    if(disposed) return;
    if(reduced) { counter.textContent='000'; later(cleanup,200); return; }
    words.forEach(word=>tween(word,[{opacity:0,transform:'translateY(120%)'},{opacity:1,transform:'translateY(0)'}],1000));
    later(()=> {
      if(!available.length){finish();return;}
      const width=Math.min(440,innerWidth*(innerWidth<=600?.43:.29));
      tween(artwork,[{width:'0px'},{width:width+'px'}],1200);
      current=available[0];
      tween(current,[{opacity:0,transform:'scale(0) rotate(0deg)'},{opacity:1,transform:'scale(1) rotate(15deg)'}],800,500,'cubic-bezier(.2,.9,.25,1.15)');
      later(()=> {
        const start=performance.now();let index=0;
        countdown(start);
        function cycle() {
          const elapsed=performance.now()-start;
          if(elapsed>=5000){finish();return;}
          const interval=100+400*(1-Math.sin(Math.min(elapsed/5000,1)*Math.PI));
          later(()=> {
            current.getAnimations().forEach(a=>a.cancel());current.style.opacity='0';
            index=(index+1)%available.length;current=available[index];
            current.getAnimations().forEach(a=>a.cancel());
            tween(current,[{opacity:0,transform:'scale(.8)'},{opacity:1,transform:'scale(1)'}],320,0,'cubic-bezier(.2,.9,.25,1.15)');
            cycle();
          },interval);
        }
        cycle();
      },1300);
    },1000);
  }
  // Slow or broken artwork cannot stall the intro. Use whichever files decoded.
  let started=false;
  const start=items=>{if(started||disposed)return;started=true;run(items.filter(Boolean));};
  Promise.all(images.map(ready)).then(start).catch(()=>start([]));
  later(()=>start(images.filter(img=>img.complete&&img.naturalWidth)),1800);
})();
