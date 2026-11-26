/* Visit tracker for trygroundworksolutions.com. Sends to the gw-site Worker (site-stats/ in the
   groundwork-solutions folder); results at trygroundworksolutions.com/stats.
   Records: page, where the visitor came from (referrer + utm tags), time actually looking at the
   page, how far they scrolled, which sections they saw, and what they clicked. No cookies, no
   names, nothing typed into forms. Country/city/network are added by Cloudflare on arrival.
   Skip your own visits: open any page once with ?notrack=1 (undo with ?notrack=0). */
(() => {
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const URL_E = local ? 'http://127.0.0.1:8787/e' : 'https://gw-site.bibbinsazi.workers.dev/e';
  const store = (() => { try { localStorage.setItem('gw_t', '1'); localStorage.removeItem('gw_t'); return localStorage; } catch { return null; } })();
  const get = (k) => (store ? store.getItem(k) : null), set = (k, v) => store && store.setItem(k, v);
  const q = new URLSearchParams(location.search);
  if (q.has('notrack')) set('gw_nt', q.get('notrack') === '0' ? '' : '1');
  if (get('gw_nt')) return;

  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => (b % 36).toString(36)).join('');
  const now = Date.now();
  let vid = get('gw_v'); const isNew = !vid;
  if (!vid) { vid = rid(); set('gw_v', vid); }
  // A visit ends after 30 quiet minutes, or when someone arrives through a new tagged link.
  let s = null; try { s = JSON.parse(get('gw_s') || 'null'); } catch { /* start fresh */ }
  const tagged = q.get('utm_campaign') || q.get('utm_source');
  if (!s || now - s.last > 30 * 60e3 || (tagged && tagged !== s.tag)) s = { id: rid(), last: now, tag: tagged || (s && s.tag) || '' };
  const sid = s.id, pid = rid();
  const touch = () => { s.last = Date.now(); set('gw_s', JSON.stringify(s)); };

  const post = (events, beacon) => {
    touch();
    const body = JSON.stringify({ v: vid, s: sid, n: isNew, e: events });
    try {
      if (beacon && navigator.sendBeacon && navigator.sendBeacon(URL_E, new Blob([body], { type: 'text/plain' }))) return;
      fetch(URL_E, { method: 'POST', body, keepalive: true, mode: 'no-cors', headers: { 'content-type': 'text/plain' } }).catch(() => {});
    } catch { /* never break the page */ }
  };

  // ---- the page view
  const utm = {};
  for (const k of ['source', 'medium', 'campaign', 'term', 'content']) if (q.get('utm_' + k)) utm[k] = q.get('utm_' + k);
  const cid = q.has('gclid') ? 'google ads' : q.has('li_fat_id') ? 'linkedin ads' : q.has('fbclid') ? 'facebook' : q.has('msclkid') ? 'bing ads' : null;
  const rest = new URLSearchParams(location.search);
  for (const k of [...rest.keys()]) if (/^utm_|^(gclid|fbclid|li_fat_id|msclkid|notrack)$/.test(k)) rest.delete(k);
  post([{ k: 'pv', p: pid, path: location.pathname, title: document.title, q: rest.toString(), ref: document.referrer, utm, cid,
    lang: navigator.language, screen: `${screen.width}x${screen.height}`, wd: navigator.webdriver ? 1 : 0 }]);

  // ---- time actually looking: counted while the tab is in front and someone moved, scrolled or typed in the last minute
  let active = 0, lastAct = Date.now(), maxScroll = 0, dirty = false;
  const act = () => { lastAct = Date.now(); };
  for (const ev of ['mousemove', 'mousedown', 'keydown', 'scroll', 'wheel', 'touchstart']) addEventListener(ev, act, { passive: true, capture: true });
  setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - lastAct < 60e3) { active += 1000; dirty = true; } }, 1000);
  const scrolled = () => {
    const h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    const pct = h <= innerHeight ? 100 : Math.round(((scrollY + innerHeight) / h) * 100);
    if (pct > maxScroll) { maxScroll = Math.min(100, pct); dirty = true; }
  };
  addEventListener('scroll', scrolled, { passive: true }); addEventListener('load', scrolled); scrolled();

  // ---- sections seen (any <section> or <footer> with an id)
  const seen = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((list) => list.forEach((x) => { if (x.isIntersecting && !seen.has(x.target.id)) { seen.add(x.target.id); dirty = true; } }), { threshold: 0.35 });
    const watch = () => document.querySelectorAll('section[id], footer[id]').forEach((el) => io.observe(el));
    document.readyState === 'loading' ? addEventListener('DOMContentLoaded', watch) : watch();
  }

  const ping = (beacon) => post([{ k: 'ping', p: pid, a: active, t: Date.now() - now, sc: maxScroll, sec: [...seen] }], beacon);
  setInterval(() => { if (dirty) { dirty = false; ping(false); } }, 15000);
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') ping(true); });
  addEventListener('pagehide', () => ping(true));

  // ---- clicks, copies, form sends (only the words on the button and where it goes, never what was typed)
  const words = (el) => (el.getAttribute('aria-label') || el.innerText || el.value || el.title || '').trim().replace(/\s+/g, ' ').slice(0, 100);
  addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('a, button, summary, [role="button"], [role="tab"], input[type="submit"]');
    if (!el) return;
    let type = 'click', target = '';
    if (el.tagName === 'A' && el.href) {
      target = el.href;
      const u = new URL(el.href, location.href);
      type = el.hasAttribute('download') ? 'download' : /^(mailto|tel|sms):/.test(u.protocol) ? 'contact' : u.host && u.host !== location.host ? 'outbound' : 'click';
    }
    post([{ k: 'ev', p: pid, type, label: words(el), target, path: location.pathname }], true);
  }, { capture: true });
  addEventListener('submit', (e) => {
    const f = e.target;
    post([{ k: 'ev', p: pid, type: 'form', label: f.id || f.getAttribute('name') || f.getAttribute('aria-label') || 'form', target: f.getAttribute('action') || '', path: location.pathname }], true);
  }, { capture: true });
  addEventListener('copy', () => {
    const t = String(getSelection() || '').trim().replace(/\s+/g, ' ');
    if (t) post([{ k: 'ev', p: pid, type: 'copy', label: t.slice(0, 80), path: location.pathname }], true);
  });
})();
