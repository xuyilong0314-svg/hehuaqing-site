(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const match = location.pathname.match(/^\/books\/([^/]+)\/(?:([^/]+)\.html)?$/);
  function retainOfflineLinks() {
    for (const a of document.querySelectorAll('a[href]')) {
      const u = new URL(a.href, location.href);
      if (u.origin === location.origin && match && u.pathname.startsWith('/books/' + match[1] + '/') && /(?:\/|\.html)$/.test(u.pathname)) {
        u.searchParams.set('offline', '1'); a.href = u.href;
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retainOfflineLinks, {once:true}); else retainOfflineLinks();
  if (params.get('offline') === '1' || !navigator.onLine) return;
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 2200);
  fetch('/site-version.json', {cache:'no-store',signal:controller.signal}).then(r => r.ok ? r.json() : null).then(version => {
    if (!version?.edition) return;
    let target = '#books';
    if (match) target = !match[2] || match[2] === 'index' ? '#books/' + match[1] : '#read/' + match[1] + '/' + match[2];
    if (location.hash && target.startsWith('#read/')) {
      let at = location.hash.slice(1); try { at = decodeURIComponent(at); } catch {}
      target += '?at=' + encodeURIComponent(at);
    }
    location.replace('/' + target);
  }).catch(() => {}).finally(() => clearTimeout(timeout));
})();
