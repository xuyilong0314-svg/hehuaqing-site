import { createBookListening } from './book-listening.js?v=20261121-1';

const tanjing = Boolean(document.querySelector('.book-unit'));
const selector = tanjing ? '.book-unit' : '[data-reading-unit]';
const units = new Map([...document.querySelectorAll(selector)].map(node => [node.id, node]));
const contents = [...document.querySelectorAll('a[data-chapter]')];
const chapters = tanjing || !contents.length
  ? [...units].map(([id, unit]) => ({ id, title: unit.querySelector('h1,h2')?.textContent.trim() || '正文' }))
  : contents.map(link => ({
    id: link.dataset.chapter,
    title: (link.querySelector('.toc-title') || link.lastElementChild || link).textContent.trim(),
    url: link.href,
  }));

function fragmentUnit() {
  try { return document.getElementById(decodeURIComponent(location.hash.slice(1)))?.closest(selector)?.id; }
  catch { return null; }
}

function currentChapter(fromLink = false) {
  const linked = fromLink && fragmentUnit();
  if (linked) return linked;
  if (contents.length && units.size === 1) return units.keys().next().value;
  if (tanjing) {
    return document.querySelector('#reader:not([hidden]) .book-unit:not([hidden])')?.id || chapters[0].id;
  }
  return [...units.values()].filter(node => node.getBoundingClientRect().top < 130).at(-1)?.id || chapters[0].id;
}

if (chapters.length) {
  const player = createBookListening({
    chapters,
    async getBody(id, signal) {
      if (units.has(id)) return units.get(id);
      const url = chapters.find(chapter => chapter.id === id)?.url;
      const response = await fetch(url, { signal, mode: 'same-origin' });
      if (!response.ok) throw Error('Chapter unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const body = page.getElementById(id);
      if (!body?.matches(selector)) throw Error('Invalid chapter');
      return body;
    },
  });

  const toolbar = document.querySelector(tanjing ? '.top-actions' : '.toolbar-actions');
  const coverActions = document.querySelector('#landing .hero-actions') || document.getElementById('begin-reading')?.parentElement;

  for (const [parent, className] of [[toolbar, tanjing ? 'quiet-button' : 'control'], [coverActions, tanjing ? 'text-button' : 'control']]) {
    if (!parent) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = '听书';
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => player.open(currentChapter()));
    parent.append(button);
  }

  const url = new URL(location.href);
  // A chapter link to the split book is resolved by its reader before removing this parameter.
  if (url.searchParams.get('listen') === '1' && (units.size || !url.hash)) {
    url.searchParams.delete('listen');
    history.replaceState(history.state, '', url);
    player.open(currentChapter(true));
  }
}
