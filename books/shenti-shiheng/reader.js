(() => {
  'use strict';
  const body = document.body;
  const prefix = 'hhq-reader:' + (body.dataset.bookId || 'shenti-shiheng-v25a') + ':';
  const chapter = body.dataset.chapter;
  const title = body.dataset.title;
  const read = (key, fallback) => { try { const saved = localStorage.getItem(prefix + key); const legacy = body.dataset.bookId === 'shenti-shiheng-v25a' ? localStorage.getItem('hhq-book-v25:' + key) : null; return JSON.parse(saved ?? legacy) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(prefix + key, JSON.stringify(value)); return true; } catch { return false; } };
  const safeChapter = value => /^(dedication|navigation|prologue|ch(?:0[1-9]|1[0-5])|appendix[1-5]|transparency|afterword)$/.test(value || '');
  const safeAnchor = value => /^b-\d{3}$/.test(value || '');
  const href = (id, anchor) => `${id}.html${safeAnchor(anchor) ? '#' + anchor : ''}`;
  let toastTimer;
  const toast = text => { const el = document.querySelector('#reader-toast'); if (!el) return; el.textContent = text; el.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2500); };
  let settings = read('settings', {size:18, theme:'paper'});
  if (!settings || typeof settings !== 'object') settings = {size:18,theme:'paper'};
  const applySettings = () => {
    settings.size = Math.max(16, Math.min(26, Number(settings.size) || 18));
    if (!['paper','light','dark'].includes(settings.theme)) settings.theme = 'paper';
    document.documentElement.style.setProperty('--reader-size', settings.size + 'px');
    document.documentElement.dataset.readerTheme = settings.theme;
    document.querySelector('#font-value').textContent = settings.size;
    document.querySelector('#smaller').disabled = settings.size <= 16;
    document.querySelector('#larger').disabled = settings.size >= 26;
    document.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === settings.theme)));
  };
  applySettings();
  document.querySelector('#smaller').addEventListener('click', () => { settings.size -= 2; applySettings(); write('settings',settings); });
  document.querySelector('#larger').addEventListener('click', () => { settings.size += 2; applySettings(); write('settings',settings); });
  document.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => { settings.theme = b.dataset.theme; applySettings(); write('settings',settings); }));
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.open);
    if (dialog.id === 'marks-dialog') renderMarks();
    dialog.showModal();
    if (dialog.id === 'search-dialog') document.querySelector('#book-search').focus();
  }));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target.closest('a[href]')) dialog.close(); }));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); } }));
  document.querySelectorAll('.image-open').forEach(button => button.addEventListener('click', () => {
    const original = button.querySelector('img'); const dialog = document.querySelector('#image-dialog');
    const preview = dialog.querySelector('img'); preview.src = original.src; preview.alt = original.alt; dialog.showModal();
  }));
  if (chapter) document.querySelectorAll(`[data-chapter="${chapter}"]`).forEach(a => { if (a.tagName === 'A') a.setAttribute('aria-current','page'); });
  const blocks = [...document.querySelectorAll('.chapter-content [data-block]')];
  const currentBlock = () => { let block = blocks[0]; for (const b of blocks) { if (b.getBoundingClientRect().top <= 140) block = b; else break; } return block; };
  let lastPosition = null;
  const updatePosition = () => {
    if (!chapter || !blocks.length) return;
    const content = document.querySelector('.chapter-content'); const rect = content.getBoundingClientRect();
    const percent = Math.round(Math.max(0, Math.min(100, (140 - rect.top) / Math.max(1, rect.height - innerHeight + 200) * 100)));
    document.querySelector('#reading-bar').style.width = percent + '%';
    document.querySelector('#progress-text').textContent = percent + '%';
    lastPosition = {chapter, title, anchor:currentBlock()?.id, percent};
    write('position', lastPosition);
  };
  let scrollTimer;
  addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(updatePosition,180); }, {passive:true});
  addEventListener('pagehide', () => { if (chapter && lastPosition) write('position',lastPosition); });
  if (chapter) {
    if (location.hash && safeAnchor(location.hash.slice(1))) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    addEventListener('load', updatePosition, {once:true});
  } else {
    const position = read('position', null); const resume = document.querySelector('#resume-reading');
    if (resume && position && safeChapter(position.chapter)) { resume.href = href(position.chapter,position.anchor); resume.textContent = '继续阅读：' + String(position.title || '') + ' →'; resume.hidden = false; }
  }
  const getMarks = () => { const stored = read('bookmarks',[]); return Array.isArray(stored) ? stored.filter(x => x && safeChapter(x.chapter) && safeAnchor(x.anchor)) : []; };
  document.querySelector('#add-mark')?.addEventListener('click', () => {
    const block = currentBlock(); if (!block) return;
    const marks = getMarks();
    if (marks.some(x => x.chapter === chapter && x.anchor === block.id)) { toast('这一处已在书签中'); return; }
    marks.unshift({chapter,title,anchor:block.id,excerpt:(block.textContent || block.querySelector('img')?.alt || '图示').trim().slice(0,35),time:Date.now()});
    if (write('bookmarks',marks.slice(0,100))) toast('书签已保存到本机'); else toast('当前浏览器无法保存书签');
  });
  function renderMarks() {
    const container = document.querySelector('#marks-list'); container.replaceChildren(); const marks = getMarks();
    if (!marks.length) { const p = document.createElement('p'); p.className='empty-note'; p.textContent='还没有书签。读到想留下的地方，点击底部“加书签”。'; container.append(p); return; }
    marks.forEach(mark => { const row = document.createElement('div'); row.className='mark-item'; const a = document.createElement('a'); a.href=href(mark.chapter,mark.anchor); a.textContent=String(mark.title); const small=document.createElement('small'); small.textContent=String(mark.excerpt)+'…'; a.append(small); const del=document.createElement('button'); del.textContent='移除'; del.setAttribute('aria-label','移除书签：'+mark.title); del.addEventListener('click', () => { write('bookmarks',getMarks().filter(x=>!(x.chapter===mark.chapter&&x.anchor===mark.anchor))); renderMarks(); }); row.append(a,del); container.append(row); });
  }
  let searchData = null, searchRequest = null, searchVersion=0;
  const searchInput = document.querySelector('#book-search');
  const status = document.querySelector('#search-status');
  const resultBox = document.querySelector('#search-results');
  const markText = (parent, text, query) => { const index=text.indexOf(query); if(index<0) { parent.textContent=text; return; } parent.append(document.createTextNode(text.slice(0,index))); const mark=document.createElement('mark'); mark.textContent=query; parent.append(mark,document.createTextNode(text.slice(index+query.length))); };
  async function searchBook() {
    const version=++searchVersion; const query=searchInput.value.trim(); resultBox.replaceChildren();
    if(query.length<2) { status.textContent='输入至少两个字，查找原文。'; return; }
    status.textContent='正在查找…';
    try {
      if (!searchData) { if (!searchRequest) searchRequest=fetch('search-index.json').then(r=>{if(!r.ok)throw Error('search');return r.json();}).catch(e=>{searchRequest=null;throw e;}); searchData=await searchRequest; }
      if(version!==searchVersion)return;
      const matches=searchData.filter(x=>x.text.includes(query)); const results=matches.slice(0,40);
      status.textContent=matches.length ? `找到 ${matches.length} 处${matches.length>40?'，先展示前 40 处':''}` : '暂未找到，请换一个关键词。';
      results.forEach(result=>{const a=document.createElement('a'); a.className='result'; a.href=href(result.chapter,result.anchor); const h=document.createElement('strong');h.textContent=result.title;const p=document.createElement('p');const idx=result.text.indexOf(query); const start=Math.max(0,idx-25),end=Math.min(result.text.length,idx+query.length+65);markText(p,(start?'…':'')+result.text.slice(start,end)+(end<result.text.length?'…':''),query);a.append(h,p);resultBox.append(a);});
    } catch { if(version===searchVersion)status.textContent='搜索索引暂时未能加载。请检查网络后重新输入，或使用目录阅读。'; }
  }
  let searchTimer;
  searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(searchBook,220);});
})();
