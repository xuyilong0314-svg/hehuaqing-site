import {getClient,refreshAccount,signOut} from '../account/client.js?v=20261105-reading-1';
import {OWNER_DEVICE_KEY} from './config.js?v=20261031-20';
import {escapeHtml as esc,sourceNames,deviceNames,csvCell} from './metrics.js?v=20261031-20';
import {makeViews,number,date,bars,filteredPages,filteredReaders,kindName} from './report-views.js?v=20261105-reading-1';
const root=document.querySelector('#analytics-app');
const s={data:null,days:7,book:'',reader:'',query:'',type:'all',sort:'views',showZero:false,page:0};
let sequence=0,busy=false;
const sections=[['overview','网站总览'],['content','作品与章节'],['readers','读者明细'],['audience','访问来源'],['visits','最近访问']];
const current=()=>sections.some(item=>item[0]===location.hash.replace(/^#\/?/,''))?location.hash.replace(/^#\/?/,''):'overview';
const ownDevice=()=>{try{return localStorage.getItem(OWNER_DEVICE_KEY)==='yes';}catch{return false;}};
function login(text='请使用您的最高管理员账号登录。'){
 s.data=null;root.innerHTML=`<section class="login"><div class="eyebrow">何华清 · 私人管理空间</div><h1>网站管理台</h1><p>${esc(text)}</p><a class="button primary" href="../account/">登录全站账号 →</a><div class="help"><a href="../#home">返回网站</a></div></section>`;
}
function render(){
 const {data,reader,days}=s,section=current(),who=data.readers.find(r=>r.reader_key===reader),views=makeViews(s);
 root.innerHTML=`<section class="admin-heading"><div><p class="eyebrow">何华清 · 网站管理台</p><h1>${sections.find(item=>item[0]===section)[1]}</h1><p>从一本书，到每一次具体的阅读。</p></div><span class="admin-private">仅您的管理员账号可见</span></section><nav class="report-nav" aria-label="管理台栏目">${sections.map(([key,label])=>`<a href="#/${key}" ${section===key?'aria-current="page"':''}>${label}<span>↗</span></a>`).join('')}</nav><div class="toolbar"><div class="periods">${[[1,'今天'],[7,'近7天'],[30,'近30天'],[90,'近90天']].map(([n,l])=>`<button data-days="${n}" aria-pressed="${days===n}">${l}</button>`).join('')}</div><div class="toolbar-actions"><button class="button" data-action="refresh">刷新</button><button class="button" data-action="export">导出明细 ↓</button></div></div><div id="report-message" role="status"></div>${reader?`<div class="reader-scope"><div><strong>${esc(who?.reader_name||'所选读者')}</strong><span>当前作品、章节、来源与最近访问仅显示这位读者的记录</span></div><button class="button" data-action="clear-reader">查看全部读者</button></div>`:''}<div id="report-body">${section==='overview'?views.overview():section==='content'?views.content():section==='readers'?views.readers():section==='visits'?views.recent():`<div class="grid"><section class="panel"><h2>从哪里来到这里</h2>${bars(data.sources,sourceNames)}</section><section class="panel"><h2>用什么设备阅读</h2>${bars(data.devices,deviceNames)}</section></div>`}</div><div class="statusline"><span>更新于 ${esc(date(data.until))}</span><label><input id="exclude-own-device" type="checkbox" ${ownDevice()?'checked':''}>排除这台设备的访问</label><button class="button" data-action="logout">退出登录</button></div><div class="notice">${data.totals.legacy_views?`本范围含 ${number(data.totals.legacy_views)} 次旧版记录，按当时地址归类；未记录的站内章节切换无法补回。<br>`:''}匿名访客每天去重，换设备或跨天可能重复计数；“读者人次”不等于跨天去重人数。正文到达与停留只反映浏览行为。已保存历史的登录读者可按昵称查看，关闭后取消历史账号关联。<a href="./privacy.html">统计说明 ↗</a></div>`;
}
async function load(){
 const ticket=++sequence;busy=true;root.setAttribute('aria-busy','true');const m=document.querySelector('#report-message');if(m)m.textContent='正在更新…';
 try{const db=await getClient(),r=await db.rpc('get_site_reading_analytics',{p_days:s.days,p_reader:s.reader||null});if(ticket!==sequence)return;if(r.error)throw r.error;if(!r.data?.books||!r.data.pages)throw Error('invalid_report');s.data=r.data;render();}
 catch(error){if(ticket!==sequence)return;if(error?.code==='42501'||error?.code==='PGRST301'){login('当前账号没有管理台权限，请使用最高管理员账号登录。');return;}if(s.data){const m=document.querySelector('#report-message');if(m)m.innerHTML='<div class="error">更新未成功，当前仍是上次的数据。<button class="button" data-action="refresh">重试</button></div>';}else root.innerHTML='<section class="login"><h1>暂未连接管理台</h1><p>请检查网络后重试。</p><button class="button primary" data-action="refresh">重新加载</button><div class="help"><a href="../account/">账号登录</a></div></section>';}
 finally{if(ticket===sequence){busy=false;root.removeAttribute('aria-busy');}}
}
function exportData(){
 let rows;
 if(current()==='readers')rows=[['读者','类型','读过的书','阅读浏览','总活跃秒数','最近一次'],...filteredReaders(s).map(r=>[r.reader_name,r.identified?'登录读者':'匿名访客',r.books,r.reads,r.seconds,r.last_seen])];
 else if(current()==='visits')rows=[['读者','书名','篇名 / 章节','访问时间','活跃秒数','到达百分比','来源','设备'],...s.data.recent.map(r=>[r.reader_name,r.book_title||'',r.title,r.created_at,r.active_seconds,r.depth,sourceNames[r.source],deviceNames[r.device]])];
 else rows=[['书名','具体篇名 / 章节','类型','浏览','读者人次（按日去重）','平均活跃秒数','平均到达百分比','到达90%的次数'],...filteredPages(s).map(p=>[p.book_title||'',p.title,kindName[p.kind],p.views,p.visitors,p.seconds,p.depth,p.reached_end])];
 const blob=new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='何华清_阅读明细_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
root.addEventListener('click',async event=>{
 const target=event.target.closest('button');if(!target||busy)return;
 if(target.dataset.days){s.days=Number(target.dataset.days);s.page=0;await load();return;}
 if(target.dataset.book){s.book=target.dataset.book;s.type='book';s.sort='order';s.showZero=true;s.query='';s.page=0;if(current()!=='content')location.hash='/content';else render();requestAnimationFrame(()=>document.querySelector('#content-detail')?.scrollIntoView({block:'start'}));return;}
 if(target.dataset.reader){s.reader=target.dataset.reader;s.book='';s.type='all';s.query='';s.page=0;await load();location.hash='/visits';if(current()==='visits')render();return;}
 if(target.dataset.page!==undefined){s.page=Math.max(0,Number(target.dataset.page));render();document.querySelector('#report-body')?.scrollIntoView({block:'start'});return;}
 const action=target.dataset.action;
 if(action==='refresh')await load();if(action==='export')exportData();
 if(action==='all-books'){s.book='';s.type='all';s.page=0;s.sort='views';render();}
 if(action==='clear-reader'){s.reader='';s.page=0;await load();}
 if(action==='logout'){sequence++;s.data=null;try{await signOut();login('已退出全站账号。');}catch{login('退出未完成，请进入我的账号重试。');}}
});
root.addEventListener('submit',e=>{if(!['content-filter','reader-filter'].includes(e.target.id))return;e.preventDefault();const f=new FormData(e.target);s.query=String(f.get('query')||'');s.type=String(f.get('type')||'all');s.sort=String(f.get('sort')||'views');s.showZero=f.get('zero')==='on';s.page=0;render();});
root.addEventListener('change',e=>{if(e.target.id==='exclude-own-device'){try{localStorage.setItem(OWNER_DEVICE_KEY,e.target.checked?'yes':'no');if(e.target.checked)window.dispatchEvent(new Event('hhq-analytics-optout'));}catch{}}});
addEventListener('hashchange',()=>{s.query='';s.page=0;if(current()==='readers')s.type='all';else if(s.type==='identified'||s.type==='anonymous')s.type='all';if(s.data)render();});
addEventListener('storage',()=>{refreshAccount().then(c=>{if(!c?.is_admin){sequence++;login();}}).catch(()=>{});});
addEventListener('hhq-account-change',event=>{if(!event.detail?.isAdmin){sequence++;busy=false;login();}});
(async()=>{try{const context=await refreshAccount();if(!context?.is_admin){login(context?'这个账号没有网站管理权限。':undefined);return;}await load();}catch{login('暂未完成权限核验，请登录后重试。');}})();
