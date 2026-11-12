import {shareData, publicNavigation} from './core.js?v=20261112-share-1';

function meta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.append(element); }
  element.setAttribute('content', content);
}
function link(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) { element = document.createElement('link'); element.rel = rel; document.head.append(element); }
  element.href = href;
}
function update() {
  const data = shareData(location.pathname, location.hash);
  for (const [key,value] of Object.entries({title:data.title,description:data.description,url:data.url,image:data.image,type:'website',site_name:'何华清',locale:'zh_CN','image:width':'600','image:height':'600','image:type':'image/jpeg','image:alt':data.title,'image:secure_url':data.image})) meta('property', 'og:'+key, value);
  meta('name', 'description', data.description);
  meta('name', 'twitter:card', 'summary');
  for (const [key,value] of Object.entries({title:data.title,description:data.description,image:data.image})) meta('name','twitter:'+key,value);
  link('image_src', data.image);
  link('apple-touch-icon', data.image);
  // Only the public Vite site uses this routing. Private services retain their
  // own navigation and URL. No new request, reload, or login is introduced.
  if (document.querySelector('script[src^="/assets/index-"]')) {
    const target = publicNavigation(location.pathname, location.hash, location.search);
    if (target && target !== location.pathname + location.search + location.hash) {
      try { history.replaceState(history.state, '', target); } catch { /* Sharing metadata still works. */ }
    }
    link('canonical', data.url);
  }
}
if (!window.__hhqShareMetadataStarted) {
  window.__hhqShareMetadataStarted = true;
  update();
  addEventListener('hashchange', update);
  addEventListener('pageshow', update);
}
