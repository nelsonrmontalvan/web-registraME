(function () {
  'use strict';

  function startCountdown() {
    var box = document.querySelector('[data-countdown]');
    if (!box) return;
    var target = new Date(box.getAttribute('data-countdown')).getTime();
    if (isNaN(target)) return;
    var units = {};
    box.querySelectorAll('[data-unit]').forEach(function (el) {
      units[el.getAttribute('data-unit')] = el;
    });

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var seconds = Math.floor(diff / 1000);
      var days = Math.floor(seconds / 86400);
      var hours = Math.floor((seconds % 86400) / 3600);
      var minutes = Math.floor((seconds % 3600) / 60);
      var secs = seconds % 60;
      if (units.dias) units.dias.textContent = pad(days);
      if (units.horas) units.horas.textContent = pad(hours);
      if (units.minutos) units.minutos.textContent = pad(minutes);
      if (units.segundos) units.segundos.textContent = pad(secs);
    }
    tick();
    setInterval(tick, 1000);
  }

  function initMenu() {
    var toggle = document.getElementById('navToggle');
    var links = document.querySelector('.nav-links');
    var cta = document.querySelector('.nav-cta');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      if (cta) cta.classList.toggle('open', open);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        if (cta) cta.classList.remove('open');
      });
    });
  }

  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var summary = item.querySelector('summary');
      if (!summary) return;
      summary.addEventListener('click', function () {
        items.forEach(function (other) {
          if (other !== item) other.removeAttribute('open');
        });
      });
    });
  }

  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.style.opacity = 1; });
      return;
    }
    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var start = vh;
      var end = vh * 0.5;
      var minOp = 0.25;
      els.forEach(function (el, i) {
        var rect = el.getBoundingClientRect();
        var dir = el.getAttribute('data-reveal');
        var p = (start - rect.top - i * 18) / (start - end);
        p = Math.max(0, Math.min(1, p));
        var eased = 1 - Math.pow(1 - p, 3);
        var travel = 1 - eased;
        el.style.opacity = minOp + (1 - minOp) * eased;
        if (p >= 1) {
          el.style.transform = '';
          el.style.filter = '';
          return;
        }
        if (dir === 'up') {
          el.style.transform = 'translateY(' + (64 * travel) + 'px) scale(' + (1 - 0.04 * travel) + ')';
        } else {
          var sign = dir === 'right' ? 1 : -1;
          var x = 56 * travel * sign;
          var rot = 2 * travel * sign;
          var scale = 1 - 0.04 * travel;
          el.style.transform = 'translateX(' + x + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
        }
        el.style.filter = 'blur(' + (3 * travel) + 'px)';
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function initDockTitle() {
    var title = document.querySelector('.dock-title');
    if (!title) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.data) textNodes.push(walker.currentNode);
    }
    textNodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.data.split('').forEach(function (ch) {
        var span = document.createElement('span');
        if (ch === ' ') {
          span.className = 'space';
        } else {
          span.className = 'char';
          span.textContent = ch;
        }
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });

    var chars = Array.prototype.slice.call(title.querySelectorAll('.char'));
    if (!chars.length) return;
    var spans = Array.prototype.slice.call(title.querySelectorAll('.char, .space'));
    spans.forEach(function (sp, i) { sp.style.setProperty('--i', String(i)); });
    var cur = new Float32Array(chars.length);
    var target = new Float32Array(chars.length);
    var raf = null;
    var hovering = false;

    function settle() {
      var needed = false;
      for (var i = 0; i < chars.length; i++) {
        cur[i] += ((hovering ? target[i] : 0) - cur[i]) * 0.24;
        if (!hovering && Math.abs(cur[i]) > 0.001) needed = true;
        var s = 1 + cur[i];
        chars[i].style.transform = 'scale(' + s + ') translateY(' + (-8 * cur[i]) + 'px)';
      }
      if (hovering || needed) raf = requestAnimationFrame(settle);
      else raf = null;
    }

    function startLoop() {
      if (!raf) raf = requestAnimationFrame(settle);
    }

    title.addEventListener('mousemove', function (e) {
      var rect = title.getBoundingClientRect();
      var inY = e.clientY >= rect.top - 20 && e.clientY <= rect.bottom + 20;
      hovering = inY;
      for (var i = 0; i < chars.length; i++) {
        if (inY) {
          var r = chars[i].getBoundingClientRect();
          var d = Math.abs((r.left + r.width / 2) - e.clientX);
          var t = Math.max(0, 1 - d / 90);
          target[i] = t * t * 0.55;
        } else {
          target[i] = 0;
        }
      }
      startLoop();
    });

    title.addEventListener('mouseleave', function () {
      hovering = false;
      for (var i = 0; i < chars.length; i++) target[i] = 0;
      startLoop();
    });
  }

  function fitDockTitle() {
    var title = document.querySelector('.dock-title');
    if (!title) return;
    var chars = title.querySelectorAll('.char');
    if (!chars.length) return;
    var parentStyle = getComputedStyle(title.parentNode);
    var maxSize = title.parentNode.clientWidth - parseFloat(parentStyle.paddingLeft || 0) - parseFloat(parentStyle.paddingRight || 0) - 2;
    var minSize = 22;
    var cap = 96;
    var first = chars[0];
    var last = chars[chars.length - 1];

    function contentW() {
      return last.getBoundingClientRect().right - first.getBoundingClientRect().left;
    }

    var current = cap;
    title.style.fontSize = current + 'px';
    while (contentW() > maxSize && current > minSize) {
      current -= 1;
      title.style.fontSize = current + 'px';
    }
    while (current < cap) {
      var next = Math.min(cap, current + 1);
      title.style.fontSize = next + 'px';
      if (contentW() > maxSize) {
        title.style.fontSize = current + 'px';
        break;
      }
      current = next;
    }
  }

  function initGalleryStream() {
    var scene = document.querySelector('.stream-world');
    if (!scene) return;

    var IMAGES = [
      { src: 'assets/shot-dashboard.png', alt: 'Dashboard con Mis Secciones' },
      { src: 'assets/shot-asistencia.png', alt: 'Matriz de Asistencia' },
      { src: 'assets/shot-bitacora.png', alt: 'Bitácora de Incidencias' },
      { src: 'assets/shot-alertas.png', alt: 'Alertas Tempranas' },
      { src: 'assets/shot-horarios.png', alt: 'Horarios y bloques' },
      { src: 'assets/shot-usuarios.png', alt: 'Administración de usuarios y planes' }
    ];
    var P = {
      perspective: 30, cardWidth: 18, cardHeight: 25, cardRadius: 0.4,
      birthHeight: 2.6, exitHeight: 48, railBirth: -14, railExit: 50,
      fan: 3.3, turnBirth: 6, turnExit: 28, stops: 24
    };
    var CARDS = 7;
    var SPEED = 18;
    var AXIS = 55;

    function keyframes(dir, name, p) {
      var frames = [];
      for (var s = 0; s <= p.stops; s++) {
        var u = s / p.stops;
        var scale = (p.birthHeight / p.cardHeight) * Math.pow(p.exitHeight / p.birthHeight, u);
        var z = p.perspective * (1 - 1 / scale);
        var rail = p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan);
        var turn = p.turnBirth + (p.turnExit - p.turnBirth) * u;
        frames.push(
          (u * 100).toFixed(2) + '%{transform:translate3d(' + (dir * rail).toFixed(2) +
          'cqw,0,' + z.toFixed(2) + 'cqw) rotateY(' + (-dir * turn).toFixed(2) + 'deg)}'
        );
      }
      return '@keyframes ' + name + '{' + frames.join('') + '}';
    }

    var sceneEl = document.querySelector('.stream-scene');
    if (sceneEl) {
      sceneEl.addEventListener('click', function (e) {
        var best = null;
        var cards = sceneEl.querySelectorAll('.stream-card');
        for (var i = 0; i < cards.length; i++) {
          var card = cards[i];
          var r = card.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            if (!best || r.width > best.width) best = { el: card, w: r.width };
          }
        }
        if (best) {
          var img = best.el.querySelector('img');
          var src = (img && img.getAttribute('src')) || '';
          var alt = (img && img.getAttribute('alt')) || '';
          openLightbox(src, alt);
        }
      });
    }

    var style = document.createElement('style');
    style.textContent =
      keyframes(1, 'stream-right', P) +
      keyframes(-1, 'stream-left', P) +
      '@media(prefers-reduced-motion:reduce){.stream-card{animation-play-state:paused!important}}';
    document.head.appendChild(style);

    [
      ['stream-right', 1],
      ['stream-left', -1]
    ].forEach(function (side) {
      var name = side[0];
      var dir = side[1];
      for (var i = 0; i < CARDS; i++) {
        var img = IMAGES[i % IMAGES.length];
        var card = document.createElement('div');
        card.className = 'stream-card';
        card.style.left = '50%';
        card.style.top = AXIS + '%';
        card.style.width = P.cardWidth + 'cqw';
        card.style.height = P.cardHeight + 'cqw';
        card.style.marginLeft = (-P.cardWidth / 2) + 'cqw';
        card.style.marginTop = (-P.cardHeight / 2) + 'cqw';
        card.style.borderRadius = P.cardRadius + 'cqw';
        card.style.animation = name + ' ' + SPEED + 's linear infinite';
        card.style.animationDelay = (-(i * SPEED) / CARDS) + 's';
        var inner = document.createElement('img');
        inner.src = img.src;
        inner.alt = img.alt;
        inner.setAttribute('loading', 'lazy');
        inner.setAttribute('decoding', 'async');
        card.appendChild(inner);
        card.title = img.alt;
        card.addEventListener('click', function () { openLightbox(inner.src, inner.alt); });
        scene.appendChild(card);
      }
    });
  }

  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var lbImg = lb.querySelector('.lightbox-img');
    var lbCap = lb.querySelector('.lightbox-cap');
    function open(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCap.textContent = alt || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      lb.querySelector('.lightbox-close').focus();
    }
    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
    }
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    lb.querySelector('.lightbox-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.openLightbox = open;
  }

  document.addEventListener('DOMContentLoaded', function () {
    startCountdown();
    initMenu();
    initFaq();
    initReveal();
    initDockTitle();
    initLightbox();
    initGalleryStream();
    fitDockTitle();
  });
  window.addEventListener('load', fitDockTitle);
  var fitTimer = null;
  window.addEventListener('resize', function () {
    if (fitTimer) return;
    fitTimer = setTimeout(function () {
      fitTimer = null;
      fitDockTitle();
    }, 120);
  });
})();