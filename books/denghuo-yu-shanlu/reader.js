(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'hhq-reader-v2:' + root.dataset.book;
  const read = suffix => {
    try { return JSON.parse(localStorage.getItem(key + suffix)); } catch { return null; }
  };
  const write = (suffix, value) => {
    try { localStorage.setItem(key + suffix, JSON.stringify(value)); } catch { /* private storage can be unavailable */ }
  };
  const toolbar = document.querySelector('.toolbar');
  const units = [...document.querySelectorAll('[data-reading-unit]')].map(element => ({
    element,
    blocks: [...element.querySelectorAll('[data-reading-block]')]
  }));
  const byId = new Map(units.map(unit => [unit.element.id, unit]));
  const start = document.getElementById('begin-reading');
  const restart = document.getElementById('restart-reading');

  function readingLine() {
    return Math.max(0, toolbar.getBoundingClientRect().bottom) + 32;
  }

  function capture() {
    const line = readingLine();
    let active = null;
    for (const unit of units) {
      if (unit.element.getBoundingClientRect().top > line) break;
      active = unit;
    }
    if (!active) return null;
    const bounds = active.element.getBoundingClientRect();
    let index = -1;
    for (const block of active.blocks) {
      if (block.getBoundingClientRect().top > line) break;
      index += 1;
    }
    const target = active.blocks[index] || active.element;
    const rect = target.getBoundingClientRect();
    const fraction = index < 0 ? 0 : Math.max(0, Math.min(1, (line - rect.top) / Math.max(1, rect.height)));
    return {
      chapter: active.element.id,
      block: index,
      anchor: target.id,
      fraction,
      ratio: Math.max(0, Math.min(1, (line - bounds.top) / Math.max(1, bounds.height))),
      updated: Date.now()
    };
  }

  function validPosition(position) {
    return position && byId.has(position.chapter) && Number.isFinite(position.block);
  }

  function restore(position) {
    const unit = byId.get(position.chapter);
    const found = document.getElementById(position.anchor);
    const block = found && unit.element.contains(found) ? found : (unit.blocks[position.block] || unit.element);
    const rect = block.getBoundingClientRect();
    const within = block === unit.element ? 0 : Math.max(0, Math.min(1, Number(position.fraction) || 0));
    window.scrollTo(0, window.scrollY + rect.top - readingLine() + rect.height * within);
    return unit;
  }

  function updateStart(position) {
    if (!validPosition(position)) return;
    start.href = '#' + position.chapter;
    start.querySelector('span').textContent = '继续阅读';
    restart.hidden = false;
  }
  updateStart(read(':position'));

  let saveTimer;
  function save() {
    const position = capture();
    if (position) {
      write(':position', position);
      updateStart(position);
    }
  }
  window.addEventListener('scroll', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 220);
  }, { passive: true });
  window.addEventListener('pagehide', save);

  start.addEventListener('click', event => {
    const position = read(':position');
    if (!validPosition(position) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState(null, '', '#' + position.chapter);
    const unit = restore(position);
    unit.element.focus({ preventScroll: true });
  });
  restart.addEventListener('click', () => write(':position', null));

  const prefs = read(':settings') || {};
  const themeChoices = ['system', 'light', 'dark'];
  const sizeChoices = ['small', 'normal', 'large'];
  const validChoice = (list, value, fallback) => list.includes(value) ? value : fallback;
  root.dataset.theme = validChoice(themeChoices, prefs.theme, 'system');
  root.dataset.size = validChoice(sizeChoices, prefs.size, 'normal');

  const tocDialog = document.getElementById('contents-panel');
  const contents = document.getElementById('contents');
  const tocTrigger = document.getElementById('open-contents');
  const settingsDialog = document.getElementById('settings-panel');
  const settingsTrigger = document.getElementById('open-settings');
  const buttonChoices = [...settingsDialog.querySelectorAll('.choice')];

  function paintChoices() {
    for (const button of buttonChoices) {
      button.setAttribute('aria-pressed', String(root.dataset[button.dataset.field] === button.dataset.value));
    }
  }

  function showPanel(dialog) {
    if (dialog.open) return;
    const currentScroll = window.scrollY;
    dialog.showModal();
    if (window.scrollY !== currentScroll) window.scrollTo(0, currentScroll);
  }

  if (typeof tocDialog.showModal === 'function') {
    tocDialog.append(contents.querySelector('nav'));
    contents.hidden = true;
    tocTrigger.setAttribute('aria-haspopup', 'dialog');
    tocTrigger.addEventListener('click', event => {
      event.preventDefault();
      showPanel(tocDialog);
    });
    tocDialog.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      tocDialog.close();
      const destination = document.getElementById(link.hash.slice(1));
      requestAnimationFrame(() => destination?.focus({ preventScroll: true }));
    });
    settingsTrigger.hidden = false;
    settingsTrigger.addEventListener('click', () => {
      paintChoices();
      showPanel(settingsDialog);
    });
    for (const button of buttonChoices) {
      button.addEventListener('click', () => {
        const position = capture();
        root.dataset[button.dataset.field] = button.dataset.value;
        write(':settings', { theme: root.dataset.theme, size: root.dataset.size });
        paintChoices();
        if (position && button.dataset.field === 'size') restore(position);
      });
    }
  } else {
    tocTrigger.addEventListener('click', () => { contents.open = true; });
  }

  // A linked chapter stays aligned after the web fonts replace the fallback.
  if (location.hash.length > 1 && document.fonts) {
    const id = location.hash.slice(1);
    const destination = document.getElementById(id);
    document.fonts.ready.then(() => {
      if (destination && location.hash === '#' + id && Math.abs(destination.getBoundingClientRect().top) < 220) {
        destination.scrollIntoView();
      }
    });
  }
})();
