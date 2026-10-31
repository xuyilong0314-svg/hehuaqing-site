import {ANALYTICS_URL,ANALYTICS_KEY,OWNER_DEVICE_KEY} from './config.js?v=20261031-20';
import {escapeHtml as esc,duration,sourceNames,deviceNames,categoryNames,csvCell} from './metrics.js?v=20261031-20';
import {publicApiFetch} from '../zhongyi/aform/auth.js';
const root=document.querySelector('#analytics-app');
let db,data=null,days=7,sequence=0,admin=false;
const sections=[['overview','网站总览','让每一次阅读，被看见。','独立站访问趋势与栏目概况'],['content','内容阅读','哪些内容，值得继续写。','热门文章与电子书 · 阅读停留与到达位置'],['audience','访问来源','读者从哪里，来到这里。','微信、搜索与站内跳转 · 手机与电脑分布'],['visits','最近访问','看见最近发生的阅读。','最近20次页面访问 · 时间、来源与停留']];
const activeSection=()=>sections.find(s=>s[0]===location.hash.replace(/^#\/?/,''))||sections[0];
const number=value=>Number(value||0).toLocaleString('zh-CN');
const store=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
const ownDevice=()=>{try{return localStorage.getItem(OWNER_DEVICE_KEY)==='yes';}catch{return false;}};
const dateTime=value=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const pageUrl=path=>/^\/(?:[a-z0-9._-]+\/)*[a-z0-9._-]+\.html$/.test(path)?new URL('..'+path,import.meta.url).href:'#';
const errorText=e=>e?.code==='42501'||/analytics_admin_only/.test(e?.message)?'这个账号没有网站统计的查看权限。请使用何华清的最高管理员账号登录。':/Invalid login/.test(e?.message)?'邮箱或密码不正确，请重新输入。':/Email not confirmed/.test(e?.message)?'请先在邮箱中完成验证，再回来登录。':/PGRST202/.test(e?.code)?'访问统计后台尚未连接完成，请稍后重试。':'暂时无法连接统计后台，请检查网络后重试。';
function login(message=''){
  admin=false;data=null;sequence++;
  root.innerHTML=`<section class="login"><div class="eyebrow">PRIVATE / OWNER ACCESS</div><h1>查看网站的每一次抵达</h1><p>使用您现有的最高管理员账号登录，查看独立站的访问与阅读统计。</p><div id="login-message" role="alert">${message?`<div class="error">${esc(message)}</div>`:''}</div><form id="analytics-login"><label for="email">管理邮箱</label><input id="email" name="email" type="email" autocomplete="username" required placeholder="请输入管理邮箱"><label for="password">密码</label><input id="password" name="password" type="password" autocomplete="current-password" required placeholder="您在 A表 设置的密码"><button class="button primary" type="submit">进入访问统计</button></form><div class="help"><a href="../zhongyi/aform/#/auth">找回密码 / 账号登录</a><a href="../">返回独立站 ↗</a></div></section>`;
}
function bars(rows,names){const total=rows.reduce((n,r)=>n+Number(r.views),0);return rows.length?rows.map(r=>`<div class="bar-row"><div class="bar-meta"><span>${esc(names[r.name]||r.name)}</span><span>${number(r.views)} <small>· ${total?Math.round(r.views/total*100):0}%</small></span></div><div class="bar-track"><i style="width:${total?Math.round(r.views/total*100):0}%"></i></div></div>`).join(''):'<div class="empty">有访问后，分布会出现在这里。</div>';}
function chart(rows){
  const max=Math.max(1,...rows.flatMap(x=>[Number(x.views),Number(x.visitors)])),x=i=>rows.length===1?300:35+i*530/(rows.length-1),y=n=>170-n/max*140;
  const path=key=>rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(r[key]).toFixed(1)).join(' ');
  return `<svg class="trend" viewBox="0 0 600 205" role="img" aria-label="每日访问趋势，下方可展开每日明细"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9cac89" stop-opacity=".35"/><stop offset="100%" stop-color="#9cac89" stop-opacity=".03"/></linearGradient></defs>${[0,.5,1].map(n=>`<line x1="35" y1="${y(n*max)}" x2="575" y2="${y(n*max)}" stroke="#e4e8dd"/><text x="7" y="${y(n*max)+4}" font-size="10" fill="#718169">${Math.round(n*max)}</text>`).join('')}<path d="${path('views')} L${x(rows.length-1)},170 L${x(0)},170 Z" fill="url(#fill)"/><path d="${path('views')}" fill="none" stroke="#315940" stroke-width="2.5"/><path d="${path('visitors')}" fill="none" stroke="#ae9257" stroke-width="2" stroke-dasharray="4 3"/>${rows.map((r,i)=>rows.length<=7||i===0||i===rows.length-1||i%7===0?`<circle cx="${x(i)}" cy="${y(r.views)}" r="3" fill="#315940"/><text x="${x(i)}" y="196" text-anchor="middle" font-size="10" fill="#718169">${esc(r.day.slice(5).replace('-','/'))}</text>`:'').join('')}</svg><details class="daily-list"><summary>查看每日明细</summary><table><thead><tr><th>日期</th><th>访客</th><th>浏览</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.day)}</td><td>${number(r.visitors)}</td><td>${number(r.views)}</td></tr>`).join('')}</tbody></table></details>`;
}
function render(){
  const t=data.totals,none=!t.views;
  root.innerHTML=`<section class="hero"><div><div class="eyebrow">HE HUAQING / WEBSITE INSIGHTS</div><h1>${esc(activeSection()[2])}</h1><p>${esc(activeSection()[3])}</p></div><div class="live"><i></i>近5分钟活跃<b>${number(t.active)} <small style="color:#d4dfd1">位</small></b></div></section><nav class="report-nav" aria-label="网站统计栏目">${sections.map(([key,label])=>`<a href="#/${key}" ${activeSection()[0]===key?'aria-current="page"':''}>${label}<span>↗</span></a>`).join('')}</nav><div class="toolbar"><div class="periods" aria-label="统计时间范围">${[[1,'今天'],[7,'近7天'],[30,'近30天'],[90,'近90天']].map(([n,l])=>`<button type="button" data-days="${n}" aria-pressed="${days===n}">${l}</button>`).join('')}</div><div class="toolbar-actions"><button class="button" data-action="refresh">刷新统计</button><button class="button" data-action="export" ${none?'disabled':''}>导出表格 ↓</button></div></div><div id="report-message" role="status"></div><div class="metrics" data-report-section="overview"><article class="metric"><span>${days===1?'今日访客':'累计访客'}</span><strong>${number(t.visitors)}</strong><small>同一浏览器每天去重</small></article><article class="metric"><span>页面浏览量</span><strong>${number(t.views)}</strong><small>每次打开页面计一次</small></article><article class="metric"><span>平均活跃停留</span><strong>${duration(t.seconds)}</strong><small>按页面计算，排除后台时间</small></article><article class="metric"><span>到达页面 75%</span><strong>${t.views?Math.round(t.deep_reads/t.views*100):0}%</strong><small>${number(t.deep_reads)} 次浏览达到该位置</small></article></div>${none?'<div class="notice"><b>统计已连接，等待第一位访客。</b><br>数据从启用后开始记录。请将独立站链接发给朋友，之后点击“刷新统计”查看。</div>':''}<div class="grid" data-report-section="overview"><section class="panel"><div class="section-title"><div><h2>访问趋势</h2><p>北京时间 · 每日浏览与访客</p></div><div class="legend"><span><i></i>浏览</span><span><i class="gold"></i>访客</span></div></div>${chart(data.trend)}</section><section class="panel"><div class="section-title"><div><h2>大家在看什么</h2><p>各栏目的浏览占比</p></div></div>${bars(data.categories,categoryNames)}</section></div><section class="panel popular" data-report-section="content"><div class="section-title"><div><div class="eyebrow">READING / POPULAR PAGES</div><h2>最受关注的内容</h2><p>按浏览量排序 · 前30个页面</p></div></div>${data.pages.length?`<div class="table-wrap"><table><thead><tr><th>内容</th><th>浏览</th><th>访客</th><th>平均停留</th><th>平均到达</th></tr></thead><tbody>${data.pages.map((p,i)=>`<tr><td><span class="rank">${String(i+1).padStart(2,'0')}</span><a href="${esc(pageUrl(p.path))}">${esc(p.title)}</a><span class="label">${esc(categoryNames[p.category]||p.category)}</span></td><td class="number">${number(p.views)}</td><td class="number">${number(p.visitors)}</td><td class="number">${duration(p.seconds)}</td><td class="number">${number(p.depth)}%</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><b>第一篇被阅读的文章，会出现在这里。</b>访客打开文章或电子书后自动积累。</div>'}</section><div class="grid" data-report-section="audience"><section class="panel"><div class="section-title"><div><h2>从哪里来到这里</h2><p>浏览入口 · 微信内打开优先归类为微信</p></div></div>${bars(data.sources,sourceNames)}</section><section class="panel"><div class="section-title"><div><h2>用什么设备阅读</h2><p>按浏览次数统计</p></div></div>${bars(data.devices,deviceNames)}</section></div><section class="panel recent" data-report-section="visits"><div class="section-title"><div><h2>最近的阅读</h2><p>最近20次页面访问 · 匿名展示</p></div></div>${data.recent.length?`<div class="table-wrap"><table><thead><tr><th>时间</th><th>页面</th><th>来源</th><th>停留</th></tr></thead><tbody>${data.recent.map(r=>`<tr><td class="recent-time">${esc(dateTime(r.created_at))}</td><td><a href="${esc(pageUrl(r.path))}">${esc(r.title)}</a><span class="label">${esc(deviceNames[r.device]||r.device)}</span></td><td>${esc(sourceNames[r.source]||r.source)}</td><td class="number">${duration(r.active_seconds)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">暂时没有访问记录。</div>'}</section><div class="statusline"><span>更新于 ${esc(dateTime(data.until))} · 启用 ${esc(dateTime(data.enabled_at))}</span><label><input id="exclude-own-device" type="checkbox" ${ownDevice()?'checked':''}>排除这台设备的访问</label><button class="button" data-action="logout">退出登录</button></div><div class="notice">访客使用每日更新的随机标识，不显示真实姓名或联系方式。访客数是按日去重后的累计值；停留与滚动位置仅作阅读参考。拒绝统计、浏览器拦截或网络中断会造成遗漏。<a href="./privacy.html">了解统计方式 ↗</a></div>`;
  root.querySelectorAll("[data-report-section]").forEach(element=>{element.hidden=element.dataset.reportSection!==activeSection()[0];});
}
addEventListener("hashchange",()=>{if(admin&&data){render();window.scrollTo({top:0,behavior:"instant"});}});
async function load(){
  const current=++sequence;
  if(!data)root.innerHTML='<div class="loading">正在读取网站访问统计…</div>';
  else{const message=root.querySelector('#report-message');if(message)message.textContent='正在刷新…';}
  try{
    const {data:report,error}=await db.rpc('get_site_analytics',{p_days:days});
    if(current!==sequence)return;
    if(error)throw error;
    if(!report?.totals||!Array.isArray(report.trend))throw Error('invalid_report');
    if(!admin){store(OWNER_DEVICE_KEY,'yes');window.dispatchEvent(new Event('hhq-analytics-optout'));}
    admin=true;data=report;render();
  }catch(e){
    if(current!==sequence)return;
    if(e?.code==='42501'||e?.code==='PGRST301'){login(errorText(e));return;}
    if(data){const message=root.querySelector('#report-message');message.innerHTML=`<div class="error">${esc(errorText(e))} 当前仍显示上次读取的数据。</div>`;}
    else root.innerHTML=`<section class="login"><h1>统计暂未载入</h1><div class="error">${esc(errorText(e))}</div><button class="button primary" data-action="refresh">重新读取</button><button class="button" data-action="logout">更换账号</button></section>`;
  }
}
function exportReport(){
  if(!data||!admin)return;
  const rows=[['网站访问统计','日期范围',data.since,data.until],['日期','访客（每日去重）','页面浏览'],...data.trend.map(r=>[r.day,r.visitors,r.views]),[],['页面','栏目','浏览','访客（按日去重）','平均活跃秒数','平均到达百分比'],...data.pages.map(p=>[p.title,categoryNames[p.category]||p.category,p.views,p.visitors,p.seconds,p.depth])];
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='何华清_网站访问统计_'+new Date().toISOString().slice(0,10)+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
root.addEventListener('submit',async event=>{
  if(event.target.id!=='analytics-login')return;event.preventDefault();
  const form=event.target,button=form.querySelector('button'),fields=new FormData(form);button.disabled=true;button.textContent='正在登录…';
  const {error}=await db.auth.signInWithPassword({email:String(fields.get('email')).trim(),password:String(fields.get('password'))});
  if(error){document.querySelector('#login-message').innerHTML=`<div class="error">${esc(errorText(error))}</div>`;button.disabled=false;button.textContent='进入访问统计';return;}
  form.reset();await load();
});
root.addEventListener('click',async event=>{
  const period=event.target.closest('[data-days]');if(period){days=Number(period.dataset.days);await load();return;}
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='refresh')await load();if(action==='export')exportReport();
  if(action==='logout'){sequence++;data=null;admin=false;await db.auth.signOut();login();}
});
root.addEventListener('change',event=>{if(event.target.id==='exclude-own-device'){store(OWNER_DEVICE_KEY,event.target.checked?'yes':'no');if(event.target.checked)window.dispatchEvent(new Event('hhq-analytics-optout'));}});
async function boot(){
  try{
    db=window.supabase.createClient(ANALYTICS_URL,ANALYTICS_KEY,{global:{fetch:publicApiFetch(ANALYTICS_KEY)},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data:session,error}=await db.auth.getSession();if(error)throw error;
    if(session.session)await load();else login();
    db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')login();});
    setInterval(()=>{if(admin&&document.visibilityState==='visible')load();},60000);
  }catch{root.innerHTML='<section class="login"><h1>连接暂时中断</h1><p>请刷新页面后重试。</p><a class="button" href="../">返回独立站</a></section>';}
}
boot();
