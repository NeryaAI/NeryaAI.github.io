(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('#idea-field');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const toggle = document.querySelector('#motion-toggle');
  let width = 0, height = 0, raf = 0, last = 0, time = 0, visible = true, paused = false;
  const pointer = {x: -1000, y: -1000};
  const nodes = Array.from({length: 34}, (_, i) => ({
    side: i % 2, x: ((i * 0.618034) % 1), y: ((i * 0.414214 + .2) % 1),
    phase: i * 1.73, r: i % 5 === 0 ? 3 : 1.6,
  }));
  const ripples = [];
  function resize() {
    const box = hero.getBoundingClientRect(); width = box.width; height = box.height;
    const dpr = Math.min(devicePixelRatio, 1.5);canvas.width = width*dpr;canvas.height=height*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0); draw();
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    const dark=document.documentElement.dataset.theme==='dark';
    const rgb=dark?'187,153,224':'124,99,163';
    const density = width < 620 ? .5 : 1;
    const points = nodes.filter((_,i) => density === 1 || i % 2 === 0).map(n => {
      const band = width < 620 ? .17 : .24;
      let x = width*(n.side ? 1-band+n.x*band : n.x*band);
      let y = 35+n.y*(height-70)+Math.sin(time*.45+n.phase)*9;
      const distance=Math.hypot(x-pointer.x,y-pointer.y);
      if(distance<160&&!reduce.matches){x+=(pointer.x-x)*.08;y+=(pointer.y-y)*.08;}
      return {...n,x,y,distance};
    });
    points.forEach((a,i) => {
      points.slice(i+1).forEach(b => {
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(a.side===b.side&&d<155){ctx.strokeStyle=`rgba(${rgb},${(dark?.3:.15)*(1-d/155)})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      });
      ctx.fillStyle=`rgba(${rgb},${a.distance<150?.75:dark?.42:.22})`;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();
      if(a.r===3){ctx.strokeStyle='rgba(133,103,175,.13)';ctx.beginPath();ctx.arc(a.x,a.y,8+Math.sin(time+a.phase)*2,0,Math.PI*2);ctx.stroke();}
    });
    for(let i=ripples.length-1;i>=0;i--){const r=ripples[i],age=time-r.time;if(age>1.2){ripples.splice(i,1);continue;}ctx.strokeStyle=`rgba(120,86,168,${(1-age/1.2)*.22})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(r.x,r.y,12+age*95,0,Math.PI*2);ctx.stroke();}
  }
  function frame(now){raf=0;if(!visible||paused||reduce.matches||document.hidden)return;time+=Math.min((now-last)/1000,.05);last=now;draw();raf=requestAnimationFrame(frame);}
  function resume(){cancelAnimationFrame(raf);raf=0;last=performance.now();draw();if(visible&&!paused&&!reduce.matches&&!document.hidden)raf=requestAnimationFrame(frame);}
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();},{threshold:0}).observe(hero);
  hero.addEventListener('pointermove',e=>{const box=hero.getBoundingClientRect();pointer.x=e.clientX-box.left;pointer.y=e.clientY-box.top;},{passive:true});
  hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;});
  hero.addEventListener('pointerdown',e=>{if(e.target.closest('a,button')||reduce.matches||paused)return;const box=hero.getBoundingClientRect();ripples.push({x:e.clientX-box.left,y:e.clientY-box.top,time});if(ripples.length>5)ripples.shift();});
  toggle.addEventListener('click',()=>{paused=!paused;window.NeryaIcons.set(toggle,paused?'play':'pause');toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Play animation / 播放动效':'Pause animation / 暂停动效');resume();});
  document.addEventListener('visibilitychange',resume);
  reduce.addEventListener('change',resume);
  window.addEventListener('nerya:themechange',resume);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
  if(!reduce.matches){hero.querySelectorAll('h1 > span,.hero-description,.hero-actions').forEach((el,i)=>el.animate([{opacity:.25,transform:'translateY(15px)',filter:'blur(3px)'},{opacity:1,transform:'none',filter:'none'}],{duration:700,delay:i*90,easing:'cubic-bezier(.22,1,.36,1)'}));}
  const progress=document.querySelector('.scroll-progress');let scrollFrame=0;
  function track(){scrollFrame=0;const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;}
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(track);},{passive:true});track();
  document.querySelectorAll('.team-selector button').forEach(button=>button.addEventListener('click',()=>{if(reduce.matches)return;document.querySelector('.team-detail').animate([{opacity:.3,clipPath:'inset(0 7% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});}));
  const art=document.querySelector('.start-landscape');
  art.addEventListener('pointermove',e=>{if(reduce.matches||e.pointerType!=='mouse')return;const box=art.getBoundingClientRect();art.style.setProperty('--art-x',`${((e.clientX-box.left)/box.width-.5)*8}px`);art.style.setProperty('--art-y',`${((e.clientY-box.top)/box.height-.5)*5}px`);},{passive:true});
  art.addEventListener('pointerleave',()=>{art.style.setProperty('--art-x','0px');art.style.setProperty('--art-y','0px');});
})();
