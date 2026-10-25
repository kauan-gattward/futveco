(function(){
'use strict';
var caps=["Treino cognitivo-reativo: percepção, velocidade de resposta e decisão","Circuito Regional em Barra Grande (R2 Sports): alunos com troféus","A vida presta ☀️","Momento entre amigas na areia","1º Campeonato Interno FutVeco — 03 de outubro","Você corre ou você dá seu melhor?","Recados importantes aos alunos","Quem mais é assim? 😂","Parceria Vida de Sereia","Qualidade do treino = evolução","Nem é meme","Treinar é meu hobbie favorito","Como está o condicionamento de vocês?","Dica boa é dica compartilhada","Conexão Brasil x Israel com @omer_sharvit_","Seguimos no foco","Marque quem precisa da dica","Primeiro aulão de trick com o prof. @jpzin__19","Todo dia é a mesma história"];
var body=document.body;body.classList.add('loading');
// gallery
var gal=document.getElementById('gal');
caps.forEach(function(c,i){var n=('0'+(i+1)).slice(-2),f=document.createElement('figure');f.className='reveal';f.dataset.i=i;
f.innerHTML='<img src="img/'+n+'.jpg" alt="'+c.replace(/"/g,'')+'" loading="lazy"><figcaption>'+c+'</figcaption>';gal.appendChild(f);});
// loader
var bar=document.querySelector('.lbar i'),hero=document.querySelector('.hero-bg img'),p=10;bar.style.width='10%';
var t=setInterval(function(){p=Math.min(p+15,90);bar.style.width=p+'%';},150);
function done(){clearInterval(t);bar.style.width='100%';setTimeout(function(){document.getElementById('loader').classList.add('done');body.classList.remove('loading');body.classList.add('ready');},300);}
if(hero.complete)setTimeout(done,600);else{hero.addEventListener('load',done);hero.addEventListener('error',done);}setTimeout(done,4000);
// reveal + counters
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
var b=e.target.querySelector('[data-count]');if(b)count(b);});},{threshold:.15,rootMargin:'0px 0px -40px'});
document.querySelectorAll('.reveal').forEach(function(el,i){el.style.transitionDelay=(i%4)*80+'ms';io.observe(el);});
function count(el){var end=+el.dataset.count,s=null;function st(ts){if(!s)s=ts;var k=Math.min((ts-s)/1800,1),v=Math.round(end*(1-Math.pow(1-k,3)));el.textContent=v.toLocaleString('pt-BR');if(k<1)requestAnimationFrame(st);}requestAnimationFrame(st);}
// scroll: nav, parallax, timeline
var nav=document.querySelector('.nav'),px=[].slice.call(document.querySelectorAll('[data-parallax]')),tl=document.querySelector('.timeline'),tick=false;
function onScroll(){var y=scrollY,h=innerHeight;nav.classList.toggle('solid',y>40);
px.forEach(function(el){var r=el.getBoundingClientRect();if(r.bottom<0||r.top>h)return;var c=r.top+r.height/2-h/2;el.style.transform='translate3d(0,'+(-c*el.dataset.parallax)+'px,0)';});
var r=tl.getBoundingClientRect();tl.style.setProperty('--p',Math.max(0,Math.min(1,(h*.7-r.top)/r.height)));tick=false;}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll);}},{passive:true});onScroll();
// menu
var bg=document.querySelector('.burger'),menu=document.querySelector('.menu');
bg.addEventListener('click',function(){var o=menu.classList.toggle('open');bg.classList.toggle('on',o);bg.setAttribute('aria-expanded',o);body.style.overflow=o?'hidden':'';});
menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');bg.classList.remove('on');body.style.overflow='';});});
// desktop: cursor, magnetic, tilt
if(matchMedia('(hover:hover) and (pointer:fine)').matches){
var cu=document.querySelector('.cursor'),cd=document.querySelector('.cursor-dot'),mx=0,my=0,cx=0,cy=0;
addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;cd.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';});
(function loop(){cx+=(mx-cx)*.18;cy+=(my-cy)*.18;cu.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';requestAnimationFrame(loop);})();
document.querySelectorAll('a,button,figure').forEach(function(el){el.addEventListener('mouseenter',function(){cu.classList.add('big');});el.addEventListener('mouseleave',function(){cu.classList.remove('big');});});
document.querySelectorAll('.magnetic').forEach(function(el){el.addEventListener('mousemove',function(e){var r=el.getBoundingClientRect();el.style.transform='translate('+(e.clientX-r.left-r.width/2)*.3+'px,'+(e.clientY-r.top-r.height/2)*.4+'px)';});
el.addEventListener('mouseleave',function(){el.style.transform='';});});
document.querySelectorAll('.tilt').forEach(function(el){el.addEventListener('mousemove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform='perspective(900px) rotateY('+x*10+'deg) rotateX('+(-y*10)+'deg)';});
el.addEventListener('mouseleave',function(){el.style.transform='';});});}
// lightbox
var lb=document.getElementById('lb'),li=lb.querySelector('img'),lc=lb.querySelector('.lb-c'),cur=0;
function show(i){cur=(i+caps.length)%caps.length;li.style.opacity=0;setTimeout(function(){li.src='img/'+('0'+(cur+1)).slice(-2)+'.jpg';li.alt=caps[cur];lc.textContent=(cur+1)+'/'+caps.length+' — '+caps[cur];li.style.opacity=1;},150);}
function open(i){show(i);lb.classList.add('on');lb.setAttribute('aria-hidden','false');body.style.overflow='hidden';}
function close(){lb.classList.remove('on');lb.setAttribute('aria-hidden','true');body.style.overflow='';}
gal.addEventListener('click',function(e){var f=e.target.closest('figure');if(f)open(+f.dataset.i);});
lb.querySelector('.lb-x').onclick=close;lb.querySelector('.lb-p').onclick=function(){show(cur-1);};lb.querySelector('.lb-n').onclick=function(){show(cur+1);};
lb.addEventListener('click',function(e){if(e.target===lb)close();});
addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1);});
var sx=null;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
lb.addEventListener('touchend',function(e){if(sx===null)return;var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)show(cur+(d<0?1:-1));sx=null;});
})();
