/* ═══════════════════════════════════════════════════════════════════════
   Groundwork Solutions — page behaviour
   1. theme toggle      explicit choice beats the OS, and persists
   2. scroll reveal     sections fade up as they enter
   3. marquee sizing    clones units so the -50% loop stays seamless
   4. agent tabs        the six agents, one panel at a time
   5. pipeline canvas   the animated background behind the hero
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 1. theme ─────────────────────────────────────────────────────────── */
(function () {
  var root = document.documentElement;
  var KEY = 'gw-theme';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);

  function current() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(current() === 'dark'));
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      btn.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem(KEY, next); } catch (e) {}
      window.dispatchEvent(new CustomEvent('gw:theme'));
    });
  }
})();

/* ── 2. scroll reveal ─────────────────────────────────────────────────── */
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();

/* ── 3. marquee ───────────────────────────────────────────────────────── */
(function () {
  var tracks = document.querySelectorAll('.banner__track');
  if (!tracks.length) return;

  function fill() {
    tracks.forEach(function (track) {
      var unit = track.firstElementChild;
      if (!unit) return;
      var unitW = unit.getBoundingClientRect().width;
      if (!unitW) return;
      var perHalf = Math.ceil(window.innerWidth / unitW) + 1;
      var total = perHalf * 2;
      while (track.children.length < total) {
        track.appendChild(unit.cloneNode(true));
      }
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);
  else fill();
  window.addEventListener('resize', fill, { passive: true });
})();

/* ── 4. agent tabs ────────────────────────────────────────────────────── */
(function () {
  var tablist = document.querySelector('[role="tablist"]');
  if (!tablist) return;
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) {
        if (on) panel.setAttribute('data-active', '');
        else panel.removeAttribute('data-active');
      }
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      select(next);
      next.focus();
    });
  });
})();

/* ── 6. ambient field ─────────────────────────────────────────────────────
   A fixed canvas behind the whole page. A faint drafting grid, and on top
   of it traces that route themselves the way a board is routed — 90° and
   45° segments, a via at each end — then hold and fade out. New ones keep
   spawning, so the page always has a slow pulse behind it without anything
   ever demanding attention.

   Kept cheap on purpose: the grid is rendered once to an offscreen canvas
   and blitted, only a handful of traces are ever alive, the whole thing
   stops when the tab is hidden, and it never starts at all for a visitor
   who prefers reduced motion.                                             */
(function () {
  var canvas = document.getElementById('field');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, raf = null, running = false;
  var GRID = 44;                 // drafting grid pitch, px
  var MAX = 10;                  // traces alive at once
  var traces = [];
  var grid = document.createElement('canvas');
  var gctx = grid.getContext('2d');

  function ink() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--signal');
    return (v || '#1b44e0').trim();
  }
  var COLOR = ink();

  function rebuildGrid() {
    grid.width = Math.round(W * dpr);
    grid.height = Math.round(H * dpr);
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.clearRect(0, 0, W, H);
    gctx.fillStyle = COLOR;
    gctx.globalAlpha = 0.3;
    for (var x = GRID; x < W; x += GRID) {
      for (var y = GRID; y < H; y += GRID) {
        gctx.beginPath();
        gctx.arc(x, y, 0.9, 0, Math.PI * 2);
        gctx.fill();
      }
    }
    gctx.globalAlpha = 1;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildGrid();
  }

  /* a route: start on the grid, then 2–4 legs, each either straight or a
     45° diagonal, snapped so it always lands back on a grid intersection */
  function makeTrace() {
    var cols = Math.max(2, Math.floor(W / GRID));
    var rows = Math.max(2, Math.floor(H / GRID));
    var x = (1 + Math.floor(Math.random() * (cols - 1))) * GRID;
    var y = (1 + Math.floor(Math.random() * (rows - 1))) * GRID;
    var pts = [{ x: x, y: y }];
    var legs = 2 + Math.floor(Math.random() * 3);
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

    for (var i = 0; i < legs; i++) {
      var d = dirs[Math.floor(Math.random() * dirs.length)];
      var len = (1 + Math.floor(Math.random() * 3)) * GRID;
      var nx = Math.min(Math.max(x + d[0] * len, GRID), W - GRID);
      var ny = Math.min(Math.max(y + d[1] * len, GRID), H - GRID);
      if (nx === x && ny === y) continue;
      pts.push({ x: nx, y: ny });
      x = nx; y = ny;
    }
    if (pts.length < 2) return null;

    var total = 0;
    for (var j = 1; j < pts.length; j++) {
      total += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y);
    }
    return {
      pts: pts,
      total: total,
      draw: 0,                                  // 0→1, how much is routed
      speed: 0.006 + Math.random() * 0.007,
      hold: 60 + Math.random() * 90,            // frames to sit complete
      fade: 1,
      phase: 'draw'
    };
  }

  function strokeTrace(t) {
    var target = t.draw * t.total;
    var run = 0;
    var head = t.pts[0];                       // where the route has got to
    ctx.beginPath();
    ctx.moveTo(t.pts[0].x, t.pts[0].y);
    for (var i = 1; i < t.pts.length; i++) {
      var a = t.pts[i - 1], b = t.pts[i];
      var seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (run + seg <= target) {
        ctx.lineTo(b.x, b.y);
        run += seg;
        head = b;
      } else {
        var k = Math.max(0, (target - run) / seg);
        head = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        ctx.lineTo(head.x, head.y);
        break;
      }
    }
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.6 * t.fade;
    ctx.stroke();

    ctx.fillStyle = COLOR;

    // via at the origin, and at the far end once the route lands
    ctx.globalAlpha = 0.7 * t.fade;
    ctx.beginPath();
    ctx.arc(t.pts[0].x, t.pts[0].y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    if (t.draw >= 1) {
      var last = t.pts[t.pts.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // a brighter head while it is still routing — this is the bit that
      // makes the whole field read as alive rather than as wallpaper
      ctx.globalAlpha = 0.5 * t.fade;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.95 * t.fade;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(grid, 0, 0, W, H);

    while (traces.length < MAX) {
      var t = makeTrace();
      if (!t) break;
      traces.push(t);
    }

    for (var i = traces.length - 1; i >= 0; i--) {
      var tr = traces[i];
      if (tr.phase === 'draw') {
        tr.draw += tr.speed;
        if (tr.draw >= 1) { tr.draw = 1; tr.phase = 'hold'; }
      } else if (tr.phase === 'hold') {
        if (--tr.hold <= 0) tr.phase = 'fade';
      } else {
        tr.fade -= 0.012;
        if (tr.fade <= 0) { traces.splice(i, 1); continue; }
      }
      strokeTrace(tr);
    }

    raf = requestAnimationFrame(step);
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(step); } }

  resize();
  start();

  window.addEventListener('resize', function () { resize(); }, { passive: true });
  /* No visibilitychange handler on purpose: requestAnimationFrame already
     stops firing on a hidden tab, so a manual pause/resume adds nothing but
     a way to get permanently stuck stopped if the resume event never lands. */
  window.addEventListener('gw:theme', function () { COLOR = ink(); rebuildGrid(); });
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function () { COLOR = ink(); rebuildGrid(); });
  }
})();

/* ── 5. the pipeline ──────────────────────────────────────────────────────
   A literal picture of the product: work arrives on the left (a call, an
   email, a form), passes through the agent in the middle, and leaves as an
   outcome on the right (booked, replied, routed). Packets flow along the
   curves continuously.

   Deliberately quiet — it sits at low alpha behind the headline and is
   masked top and bottom by CSS. It is decorative, so the canvas is
   aria-hidden and it degrades to a single static frame when the visitor
   prefers reduced motion.                                                 */
(function () {
  var canvas = document.getElementById('pipeline');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, raf = null, running = false;

  var INPUTS  = ['call', 'email', 'form'];
  var OUTPUTS = ['booked', 'replied', 'routed'];

  // packets in flight: t runs 0→1 along a lane, then respawns
  var packets = [];
  for (var i = 0; i < 14; i++) {
    packets.push({
      lane: i % 3,
      out: (i * 7) % 3,
      t: Math.random(),
      speed: 0.0016 + Math.random() * 0.0022,
      leg: Math.random() < 0.5 ? 0 : 1   // 0 = input→agent, 1 = agent→output
    });
  }

  function palette() {
    var cs = getComputedStyle(document.documentElement);
    return {
      line: (cs.getPropertyValue('--signal') || '#1b44e0').trim(),
      ink: (cs.getPropertyValue('--ink-soft') || '#4d5a72').trim()
    };
  }
  var pal = palette();
  window.addEventListener('gw:theme', function () { pal = palette(); });
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function () { pal = palette(); });
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // geometry, recomputed from current size each frame-ish
  function geom() {
    var cx = W * 0.72;              // agent sits right of centre, clear of the text
    var cy = H * 0.52;
    var leftX = W * 0.42;
    var rightX = W * 0.95;
    var spread = Math.min(H * 0.30, 150);
    return {
      cx: cx, cy: cy,
      inputs: INPUTS.map(function (_, i) {
        return { x: leftX, y: cy + (i - 1) * spread };
      }),
      outputs: OUTPUTS.map(function (_, i) {
        return { x: rightX, y: cy + (i - 1) * spread };
      })
    };
  }

  // cubic bezier point between two nodes, bowed horizontally
  function curve(a, b, t) {
    var mx = (a.x + b.x) / 2;
    var p1 = { x: mx, y: a.y }, p2 = { x: mx, y: b.y };
    var u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * b.y
    };
  }

  function strokeCurve(a, b, alpha) {
    var mx = (a.x + b.x) / 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function node(x, y, r, filled) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (filled) {
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = pal.line;
      ctx.fill();
    }
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (W < 640) return;                 // too tight to read on phones — skip it
    var g = geom();

    // lanes
    g.inputs.forEach(function (p) { strokeCurve(p, { x: g.cx, y: g.cy }, 0.16); });
    g.outputs.forEach(function (p) { strokeCurve({ x: g.cx, y: g.cy }, p, 0.16); });

    // nodes
    g.inputs.forEach(function (p) { node(p.x, p.y, 4, false); });
    g.outputs.forEach(function (p) { node(p.x, p.y, 4, false); });

    // the agent — a soft ring, slightly breathing
    var pulse = reduced ? 0 : Math.sin(Date.now() / 1400) * 1.6;
    node(g.cx, g.cy, 17 + pulse, true);
    node(g.cx, g.cy, 27 + pulse * 1.4, false);

    // packets
    packets.forEach(function (pk) {
      var a, b;
      if (pk.leg === 0) { a = g.inputs[pk.lane]; b = { x: g.cx, y: g.cy }; }
      else { a = { x: g.cx, y: g.cy }; b = g.outputs[pk.out]; }
      var pt = curve(a, b, pk.t);
      var fade = Math.sin(pk.t * Math.PI);      // dim at both ends of the lane
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.4, 0, Math.PI * 2);
      ctx.globalAlpha = 0.75 * fade;
      ctx.fillStyle = pal.line;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  function step() {
    if (!running) return;
    packets.forEach(function (pk) {
      pk.t += pk.speed;
      if (pk.t >= 1) {
        pk.t = 0;
        if (pk.leg === 0) { pk.leg = 1; }
        else { pk.leg = 0; pk.lane = Math.floor(Math.random() * 3); pk.out = Math.floor(Math.random() * 3); }
      }
    });
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  draw();
  if (reduced) return;                    // static frame only

  window.addEventListener('resize', function () { resize(); draw(); }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // only animate while the hero is actually on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }
})();
