(() => {
  'use strict';

  const root = document.documentElement;
  const key = 'hhq-reader-v2:' + root.dataset.book;
  function read(suffix) {
    try { return JSON.parse(localStorage.getItem(key + suffix)); }
    catch { return null; }
  }
  function write(suffix, value) {
    try { localStorage.setItem(key + suffix, JSON.stringify(value)); }
    catch { /* Reading is still available when storage is blocked. */ }
  }

  const toolbar = document.querySelector('.toolbar');
  const unit = document.querySelector('[data-reading-unit]');
  const blocks = unit ? [...unit.querySelectorAll('[data-reading-block]')] : [];
  const contents = document.getElementById('contents');

  function fragment() {
    try { return decodeURIComponent(location.hash.slice(1)); }
    catch { return ''; }
  }

  if (!unit) {
    const start = document.getElementById('begin-reading');
    const restart = document.getElementById('restart-reading');
    const entries = new Map([...contents.querySelectorAll('a[data-chapter]')]
      .map(link => [link.dataset.chapter, link]));
    const parts = new Map([...contents.querySelectorAll('[data-start]')]
      .map(marker => [marker.id, marker.dataset.start]));

    function redirectPublishedLink() {
      const id = fragment();
      const part = parts.get(id);
      const paragraph = id.match(/^(prologue|epilogue|ch-\d{2}|chronology|editorial)-(?:title|p?\d{2})$/);
      const chronology = /^chrono-\d{4}-\d{2}$/.test(id);
      const chapter = paragraph?.[1] || (chronology ? 'chronology' : part || id);
      const link = entries.get(chapter);
      if (!link) return false;
      const target = new URL(link.href);
      target.search = location.search;
      if (paragraph || chronology) target.hash = id;
      location.replace(target.href);
      return true;
    }

    if (redirectPublishedLink()) return;
    window.addEventListener('hashchange', redirectPublishedLink);

    function refreshStart() {
      const position = read(':position');
      const entry = position && entries.get(position.chapter);
      start.href = entry ? entry.href + '?resume=1' : 'prologue.html';
      start.querySelector('span').textContent = entry ? '继续阅读' : '开始阅读';
      restart.hidden = !entry;
    }

    refreshStart();
    window.addEventListener('pageshow', refreshStart);
    restart.addEventListener('click', () => write(':position', null));
  }

  function readingLine() {
    return Math.max(0, toolbar.getBoundingClientRect().bottom) + 32;
  }

  function capture() {
    if (!unit) return null;
    const line = readingLine();
    const bounds = unit.getBoundingClientRect();
    let index = -1;
    for (const block of blocks) {
      if (block.getBoundingClientRect().top > line) break;
      index += 1;
    }
    const target = blocks[index] || unit;
    const rect = target.getBoundingClientRect();
    return {
      chapter: unit.id,
      block: index,
      anchor: target.id,
      fraction: index < 0 ? 0 : Math.max(0, Math.min(1, (line - rect.top) / Math.max(1, rect.height))),
      ratio: Math.max(0, Math.min(1, (line - bounds.top) / Math.max(1, bounds.height))),
      updated: Date.now()
    };
  }

  function restore(position) {
    if (position?.chapter !== unit.id) return;
    const found = document.getElementById(position.anchor);
    const target = found && unit.contains(found) ? found : blocks[position.block];
    if (!target) {
      window.scrollTo(0, 0);
      return;
    }
    const rect = target.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, Number(position.fraction) || 0));
    window.scrollTo(0, window.scrollY + rect.top - readingLine() + fraction * rect.height);
  }

  const preferences = read(':settings') || {};
  const validChoice = (choices, value, fallback) => choices.includes(value) ? value : fallback;
  root.dataset.theme = validChoice(['system', 'light', 'dark'], preferences.theme, 'system');
  root.dataset.size = validChoice(['small', 'normal', 'large'], preferences.size, 'normal');

  if (unit) {
    let pending;
    let ready = false;
    const save = () => { if (ready) write(':position', capture()); };
    const oldPosition = read(':position');
    const resume = new URLSearchParams(location.search).get('resume') === '1';

    Promise.resolve(document.fonts?.ready).then(() => {
      const id = fragment();
      const linked = id && document.getElementById(id);
      if (linked && (linked === unit || unit.contains(linked))) linked.scrollIntoView();
      else if (resume) restore(oldPosition);
      ready = true;
      save();
    });

    window.addEventListener('scroll', () => {
      clearTimeout(pending);
      pending = setTimeout(save, 180);
    }, {passive: true});
    window.addEventListener('pagehide', save);
    window.addEventListener('pageshow', event => { if (event.persisted) save(); });
  }

  function showPanel(dialog) {
    if (dialog.open) return;
    const y = window.scrollY;
    dialog.showModal();
    if (window.scrollY !== y) window.scrollTo(0, y);
  }

  const toc = document.getElementById('contents-panel');
  const openContents = document.getElementById('open-contents');
  if (toc && typeof toc.showModal === 'function') {
    toc.append(contents.querySelector('nav'));
    contents.hidden = true;
    openContents.setAttribute('aria-haspopup', 'dialog');
    openContents.addEventListener('click', event => {
      event.preventDefault();
      showPanel(toc);
    });
    toc.addEventListener('click', event => {
      if (!event.target.closest('a[aria-current="page"]')) return;
      event.preventDefault();
      toc.close();
    });
  } else if (toc) {
    openContents.addEventListener('click', () => { contents.open = true; });
  }

  const settings = document.getElementById('settings-panel');
  const openSettings = document.getElementById('open-settings');
  if (typeof settings.showModal === 'function') {
    const choices = [...settings.querySelectorAll('.choice')];
    function paintChoices() {
      for (const btn of choices) btn.setAttribute('aria-pressed', String(root.dataset[btn.dataset.field] === btn.dataset.value));
    }
    openSettings.hidden = false;
    openSettings.addEventListener('click', () => {
      paintChoices();
      showPanel(settings);
    });
    for (const btn of choices) {
      btn.addEventListener('click', () => {
        const position = capture();
        root.dataset[btn.dataset.field] = btn.dataset.value;
        write(':settings', {theme:root.dataset.theme, size:root.dataset.size});
        paintChoices();
        if (position && btn.dataset.field === 'size') restore(position);
      });
    }
  }
})();
