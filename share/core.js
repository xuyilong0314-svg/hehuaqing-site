import {pages, routes} from '../analytics/catalog.js?v=20261105-reading-1';

export const ORIGIN = 'https://www.hehuaqing.com';
const image = name => `${ORIGIN}/share/${name}-20261112.jpg`;
export const HOME = Object.freeze({
  title: '何华清｜著作、音乐与生活',
  description: '读懂身体，也读懂生活。走进何华清的著作、音乐与日常思考。',
  url: `${ORIGIN}/`, image: image('home')
});
export const MEDICINE = Object.freeze({
  title: '古中医｜读懂身体，记录日常',
  description: '古中医学习与上医健康服务档案。建立档案，记录变化，持续跟进。',
  url: `${ORIGIN}/zhongyi/`, image: image('zhongyi')
});
export const RECORDS = Object.freeze({
  title: '上医健康服务档案',
  description: '填写个人资料，记录日常观察，持续跟进变化。与何华清网站共用一个账号。',
  url: `${ORIGIN}/zhongyi/aform/`, image: image('records')
});

// Use public catalogue IDs only. Never derive a card from forms, saved cases,
// auth metadata, search text, callback tokens, or the current URL's query.
export function shareData(pathname, hash = '') {
  if (/^\/zhongyi\/aform(?:\/|$)/.test(pathname)) return RECORDS;
  if (/^\/(?:account|analytics|team)(?:\/|$)/.test(pathname)) return HOME;
  const route = String(hash).split('?')[0];
  let key = routes[route];
  if (/^#articles\//.test(route)) key = '/articles.html';
  if (route && !key) return HOME;
  if (!key) key = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  if (['/index.html','/home.html','/entrance.html'].includes(key)) return HOME;
  if (key === '/zhongyi/index.html') return MEDICINE;
  const page = pages[key];
  if (!page) return HOME;
  const url = /^(?:\/music\/|\/search\.html)/.test(key)
    ? new URL(page.href, ORIGIN).href
    : ORIGIN + key.replace(/\/index\.html$/, '/');
  return {
    title: `${page.title} · 何华清`,
    description: page.book_title
      ? `《${page.book_title}》 · ${page.title}。何华清著作在线阅读。`
      : '何华清的著作、文章、音乐与日常思考。点击打开，继续阅读。',
    url, image: HOME.image
  };
}

export function publicNavigation(pathname, hash, search = '') {
  // The app resolves hashes before physical paths. Keep its exact hash and
  // history state, while giving native share menus a real public document.
  // Never rewrite authentication, records, or unknown routes.
  if (/^\/(?:account|analytics|team)(?:\/|$)/.test(pathname) || pathname.startsWith('/zhongyi/aform/')) return null;
  if (!hash || !routes[hash.split('?')[0]]) return null;
  if (/[?&](?:code|access_token|refresh_token|token|token_hash|error|error_code)=/i.test(search)) return null;
  // The reported regression occurs at /#zhongyi. Give this public section its
  // existing physical document; leave book, music and reader routes untouched.
  if (hash.split('?')[0] === '#zhongyi' && ['/', '/index.html', '/zhongyi/', '/zhongyi/index.html'].includes(pathname)) return '/zhongyi/' + search + hash;
  if (['/zhongyi/', '/zhongyi/index.html'].includes(pathname)) return '/' + search + hash;
  return null;
}
