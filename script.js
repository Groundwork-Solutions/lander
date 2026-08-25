/* theme: explicit choice wins over the OS, and persists */
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
    });
  }
})();

/* scroll reveal */
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

/* marquee: clone units until half the track covers the widest viewport,
   keeping the count even so the -50% loop stays seamless */
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
