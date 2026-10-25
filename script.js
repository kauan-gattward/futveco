(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loader = doc.getElementById('loader');
  var finished = false;

  /* ---------- Loader (always finishes) ---------- */
  function done() {
    if (finished) return; finished = true;
    var bar = loader && loader.querySelector('.lbar i');
    if (bar) bar.style.width = '100%';
    setTimeout(function () {
      if (loader) loader.classList.add('done');
      body.classList.remove('loading');
      body.classList.add('ready');
      setTimeout(function () { if (loader) loader.style.display = 'none'; }, 1000);
    }, reduce ? 0 : 300);
  }
  function revealAll() {
    doc.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  // Safety net: no matter what happens below, page becomes usable.
  setTimeout(done, 3500);
  setTimeout(function () { if (!body.classList.contains('ready')) done(); }, 5000);
  window.addEventListener('error', function () { done(); revealAll(); });

  try {
    root.classList.add('js');
    body.classList.add('loading');
    var bar = loader && loader.querySelector('.lbar i'), p = 10, t;
    if (bar) { bar.style.width = '10%'; t = setInterval(function () { p = Math.min(p + 15, 90); bar.style.width = p + '%'; if (finished) clearInterval(t); }, 150); }
    var hero = doc.querySelector('.hero-bg img');
    if (!hero || hero.complete) setTimeout(done, reduce ? 0 : 600);
    else { hero.addEventListener('load', done); hero.addEventListener('error', done); }
  } catch (e) { done(); }

  /* ---------- Gallery (built with DOM APIs, no innerHTML) ---------- */
  var caps = ["Treino cognitivo-reativo: percepção, velocidade de resposta e decisão", "Circuito Regional em Barra Grande (R2 Sports): alunos com troféus", "A vida presta ☀️", "Momento entre amigas na areia", "1º Campeonato Interno FutVeco — 03 de outubro", "Você corre ou você dá seu melhor?", "Recados importantes aos alunos", "Quem mais é assim? 😂", "Parceria Vida de Sereia", "Qualidade do treino = evolução", "Nem é meme", "Treinar é meu hobbie favorito", "Como está o condicionamento de vocês?", "Dica boa é dica compartilhada", "Conexão Brasil x Israel com @omer_sharvit_", "Seguimos no foco", "Marque quem precisa da dica", "Primeiro aulão de trick com o prof. @jpzin__19", "Todo dia é a mesma história"];
  // thumb sizes (width,height) to avoid layout shift
  var sz = { '02': 853, '03': 853, '18': 853, '12': 1136, '15': 1138 };
  function pad(i) { return ('0' + (i + 1)).slice(-2); }
  var gal = doc.getElementById('gal');
  if (gal) caps.forEach(function (c, i) {
    var n = pad(i), f = doc.createElement('figure'), b = doc.createElement('button'), img = doc.createElement('img'), fc = doc.createElement('figcaption');
    f.className = 'reveal';
    b.type = 'button'; b.dataset.i = i; b.setAttribute('aria-label', 'Ampliar foto ' + (i + 1) + ': ' + c);
    img.src = 'img/thumb/' + n + '.jpg'; img.alt = c; img.loading = 'lazy'; img.decoding = 'async';
    img.width = 640; img.height = sz[n] || 1137;
    fc.textContent = c;
    b.appendChild(img); f.appendChild(b); f.appendChild(fc); gal.appendChild(f);
  });

  /* ---------- Reveal + counters ---------- */
  function count(el) {
    var end = +el.dataset.count;
    if (reduce || !window.requestAnimationFrame) { el.textContent = end.toLocaleString('pt-BR'); return; }
    var s = null; el.textContent = '0';
    function st(ts) { if (!s) s = ts; var k = Math.min((ts - s) / 1800, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString('pt-BR'); if (k < 1) requestAnimationFrame(st); }
    requestAnimationFrame(st);
  }
  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
        var b = e.target.querySelector('[data-count]'); if (b) count(b);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });
  } else revealAll();

  /* ---------- Scroll: nav, parallax, timeline ---------- */
  var nav = doc.querySelector('.nav'), tl = doc.querySelector('.timeline'), tick = false;
  var px = reduce ? [] : [].slice.call(doc.querySelectorAll('[data-parallax]'));
  function onScroll() {
    var y = window.pageYOffset, h = window.innerHeight;
    if (nav) nav.classList.toggle('solid', y > 40);
    px.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > h + 200) return;
      var c = r.top + r.height / 2 - h / 2; el.style.transform = 'translate3d(0,' + (-c * el.dataset.parallax).toFixed(1) + 'px,0)';
    });
    if (tl) { var r = tl.getBoundingClientRect(); tl.style.setProperty('--p', reduce ? 1 : Math.max(0, Math.min(1, (h * 0.7 - r.top) / r.height))); }
    tick = false;
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll lock (shared by menu + lightbox, iOS-safe) ---------- */
  var locks = 0, savedY = 0;
  function lock() {
    if (locks++ === 0) { savedY = window.pageYOffset; body.style.position = 'fixed'; body.style.top = -savedY + 'px'; body.style.left = '0'; body.style.right = '0'; }
  }
  function unlock() {
    if (locks === 0) return;
    if (--locks === 0) { body.style.position = ''; body.style.top = ''; body.style.left = ''; body.style.right = ''; root.style.scrollBehavior = 'auto'; window.scrollTo(0, savedY); root.style.scrollBehavior = ''; }
  }

  /* ---------- Mobile menu ---------- */
  var bg = doc.querySelector('.burger'), menu = doc.getElementById('menu');
  var mq = window.matchMedia('(max-width: 860px)');
  function setMenu(o) {
    if (!menu || menu.classList.contains('open') === o) return;
    menu.classList.toggle('open', o); bg.classList.toggle('on', o);
    bg.setAttribute('aria-expanded', String(o)); bg.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu');
    if (o) { lock(); var a = menu.querySelector('a'); if (a) setTimeout(function () { a.focus(); }, 50); } else unlock();
  }
  if (bg && menu) {
    bg.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!menu.classList.contains('open')) return;
        var href = a.getAttribute('href'), target = href && href.charAt(0) === '#' && doc.querySelector(href);
        setMenu(false);
        if (target) { e.preventDefault(); setTimeout(function () { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', href); }, 30); }
      });
    });
    var onMq = function () { if (!mq.matches) setMenu(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---------- Desktop: cursor, magnetic, tilt ---------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cu = doc.querySelector('.cursor'), cd = doc.querySelector('.cursor-dot'), mx = -100, my = -100, cx = -100, cy = -100, running = false;
    function loop() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cu.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.5) requestAnimationFrame(loop); else running = false;
    }
    if (cu && cd) {
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        cd.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
      doc.addEventListener('mouseover', function (e) { cu.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button'))); });
      doc.addEventListener('mouseleave', function () { cu.style.opacity = cd.style.opacity = '0'; });
      doc.addEventListener('mouseenter', function () { cu.style.opacity = cd.style.opacity = ''; });
    }
    doc.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px)'; });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
    doc.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = 'perspective(900px) rotateY(' + (x * 10).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)'; });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = doc.getElementById('lb');
  if (lb && gal) {
    var li = lb.querySelector('img'), lc = lb.querySelector('.lb-c'), cur = 0, opener = null, swapT = null, hideT = null;
    var btnX = lb.querySelector('.lb-x');
    function show(i) {
      cur = (i + caps.length) % caps.length;
      clearTimeout(swapT); li.style.opacity = 0;
      swapT = setTimeout(function () {
        li.src = 'img/' + pad(cur) + '.jpg'; li.alt = caps[cur];
        lc.textContent = (cur + 1) + '/' + caps.length + ' — ' + caps[cur];
        li.style.opacity = 1;
        // preload neighbours
        [cur + 1, cur - 1].forEach(function (k) { var im = new Image(); im.src = 'img/' + pad((k + caps.length) % caps.length) + '.jpg'; });
      }, reduce ? 0 : 150);
    }
    function open(i, from) {
      opener = from || doc.activeElement; clearTimeout(hideT);
      lb.hidden = false; lb.setAttribute('aria-hidden', 'false'); show(i); lock();
      requestAnimationFrame(function () { lb.classList.add('on'); btnX.focus(); });
    }
    function close() {
      if (lb.hidden) return;
      lb.classList.remove('on'); lb.setAttribute('aria-hidden', 'true'); unlock();
      hideT = setTimeout(function () { lb.hidden = true; }, reduce ? 0 : 300);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    gal.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) open(+b.dataset.i, b); });
    btnX.addEventListener('click', close);
    lb.querySelector('.lb-p').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb-n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu && menu.classList.contains('open')) { setMenu(false); bg.focus(); return; }
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
      else if (e.key === 'Tab') { // focus trap
        var f = [].slice.call(lb.querySelectorAll('button')), a = f.indexOf(doc.activeElement);
        e.preventDefault(); f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var sx = null, sy = null;
    lb.addEventListener('touchstart', function (e) { if (e.touches.length !== 1) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    }, { passive: true });
  }
})();
