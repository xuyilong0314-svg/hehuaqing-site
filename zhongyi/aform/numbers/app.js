import {loginHref} from '../../../account/return-to.js?v=20261119-ux-1';
import {beginLoading,singleFlight} from '../../../account/loading.js?v=20261119-ux-1';
import {getClient} from '../../../account/client.js?v=20261119-ux-1';
import {resultMarkup} from './view.js?v=20261119-ux-1';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db,viewer='',context={},clients=[],members=[],current=null,revision=0,working=false,checking=false,printUntil=0;
function clearProtected(){revision++;current=null;clients=[];members=[];context={};printUntil=0;document.body.classList.remove('print-authorized');$('#result').innerHTML='';$('#permissions').innerHTML='';$('#clients').innerHTML='';$('#workspace').hidden=true;$('#permissions').hidden=true;$('#permissions-link').hidden=true;}
function message(text,error=false){$('#status').className=error?'error':'status';$('#status').textContent=text;}
function failure(error){clearProtected();const denied=error?.code==='42501'||/number_access_denied|number_owner_only|number_case_unavailable/.test(error?.message||'');message(denied?'当前账号未开通此功能，或已无权查看这份档案。':'暂时无法核对权限，请检查网络后重试。',true);$('#status').insertAdjacentHTML('beforeend',' <button id="retry">重试</button>');}
async function rpc(name,args={}){const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data;}
async function all(name){const out=[];for(let offset=0;;offset+=200){const rows=await rpc(name,{p_offset:offset});out.push(...rows);if(rows.length<200)return out;}}
function route(){const value=location.hash.slice(1);return value==='permissions'?{admin:true}:value.startsWith('case/')?{id:value.slice(5)}:{};}
function clientOptions(selected=''){const q=$('#search').value.trim().toLowerCase(),rows=clients.filter(c=>!q||c.name.toLowerCase().includes(q));$('#clients').innerHTML='<option value="">请选择客户档案</option>'+rows.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===selected?' selected':'')+'>'+esc(c.name)+(c.has_birth?'':' · 生日待补填')+'</option>').join('');}
function renderMembers(){const q=($('#member-search')?.value||'').trim().toLowerCase();$('#member-list').innerHTML=members.filter(m=>!q||[m.display_name,m.email].join(' ').toLowerCase().includes(q)).map(m=>'<article class="person"><div class="person-line"><div><strong>'+esc(m.display_name||'未填写姓名')+'</strong><p><small>'+esc(m.email||'未填写邮箱')+'</small></p></div><span>'+ (m.enabled?'已开通':'未开通')+'</span></div><div class="actions"><button data-grant="'+esc(m.id)+'" data-enabled="'+!m.enabled+'" class="'+(m.enabled?'':'primary')+'">'+(m.enabled?'关闭数字性格':'开通数字性格')+'</button><button data-history="'+esc(m.id)+'">授权记录</button></div><div class="history" id="history-'+esc(m.id)+'"></div></article>').join('')||'<p>暂无符合条件的账号。</p>';}
const navigationFlights=singleFlight();
function navigate(){return navigationFlights(location.hash,async()=>{const feedback=beginLoading({readOnly:true,title:'正在展开数字性格',detail:'正在核对当前账号权限。'});try{return await navigatePage(feedback);}finally{feedback.finish();}});}
async function navigatePage(feedback){
 const ticket=++revision,where=route();current=null;printUntil=0;$('#result').innerHTML='';$('#workspace').hidden=true;$('#permissions').hidden=true;message('正在核对权限…');
 try{
  const access=await rpc('number_character_context');if(ticket!==revision)return;context=access;$('#permissions-link').hidden=!access.is_owner;
  if(!access.allowed){clearProtected();message('您的账号尚未开通数字性格，请联系何华清开通。');return;}
  if(where.admin){
   if(!access.is_owner)throw {code:'42501'};
   feedback.update('正在读取账号列表','正在准备功能权限管理。');const rows=await all('number_character_members');if(ticket!==revision)return;members=rows;
   $('#permissions').innerHTML='<h2>数字性格 · 功能权限</h2><p class="description">您本人默认开通。为其他账号单独开通或关闭；开通后仍只可查看其原本有权访问的客户，不能转授权。</p><label>搜索账号<input id="member-search" type="search" placeholder="姓名或邮箱"></label><div id="member-list" class="permissions"></div>';
   renderMembers();$('#permissions').hidden=false;message('');return;
  }
  feedback.update('正在读取客户档案','只读取您有权查看的客户。');const rows=await all('number_character_clients');if(ticket!==revision)return;clients=rows;clientOptions(where.id);$('#workspace').hidden=false;
  if(!where.id){message(rows.length?'选择一位客户，即可查看完整三角形和 1—9 号特征。':'当前没有可查看的客户档案。');return;}
  feedback.update('正在绘出数字三角形','正在读取这份档案的数字性格结果。');const result=await rpc('number_character_result',{p_case_id:where.id});if(ticket!==revision)return;current=result;$('#result').innerHTML=resultMarkup(result);message('');
 }catch(error){if(ticket===revision)failure(error);}
}
async function verifyVisible(){
 if(!db||!viewer||document.hidden||working||checking)return;checking=true;
 const ticket=revision,where=route();
 try{const access=await rpc('number_character_context');if(ticket!==revision)return;if(!access.allowed||(where.admin&&!access.is_owner))throw {code:'42501'};context=access;if(current&&where.id){const fresh=await rpc('number_character_result',{p_case_id:where.id});if(ticket!==revision)return;if(JSON.stringify(current)!==JSON.stringify(fresh)){$('#result').innerHTML=resultMarkup(fresh);}current=fresh;}}
 catch(error){if(ticket===revision)failure(error);}finally{checking=false;}
}
const startupFlights=singleFlight();
function boot(){return startupFlights('boot',async()=>{const feedback=beginLoading({readOnly:true,title:'正在打开数字性格',detail:'正在连接您的账号。'});try{return await bootPage(feedback);}finally{feedback.finish();}});}
async function bootPage(feedback){
 clearProtected();message('正在核对账号权限…');
 try{db=await getClient();const session=await db.auth.getSession();if(session.error)throw session.error;
 if(!session.data.session){message('请先登录您的网站账号。');$('#status').insertAdjacentHTML('beforeend',' <a href="'+esc(loginHref(location.pathname+location.hash))+'">前往登录</a>');return;}
 feedback.update('正在确认账号','确认后自动展开数字性格页面。');const verified=await db.auth.getUser();if(verified.error)throw verified.error;viewer=verified.data.user?.id||'';if(!viewer)throw Error('No user');
 db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||session?.user?.id!==viewer){viewer='';clearProtected();message('登录状态已变化，请重新打开此页面。');}});
 await navigate();
 }catch(error){failure(error);}
}
document.addEventListener('input',e=>{if(e.target.id==='search')clientOptions(current?.id);if(e.target.id==='member-search')renderMembers();});
document.addEventListener('change',e=>{if(e.target.id==='clients')location.hash=e.target.value?'case/'+encodeURIComponent(e.target.value):'';});
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||working||b.hasAttribute('data-number-zoom')||b.hasAttribute('data-number-close'))return;if(b.id==='retry'){await boot();return;}
 const feedback=beginLoading({title:b.id==='print'?'正在准备打印':b.dataset.grant?(b.dataset.enabled==='true'?'正在开通数字性格':'正在关闭数字性格'):'正在读取授权记录',detail:'已收到本次操作，请不要重复点击。',button:b});const ticket=revision;working=true;b.disabled=true;
 try{
  if(b.id==='print'&&current){const fresh=await rpc('number_character_result',{p_case_id:current.id});if(ticket!==revision)return;current=fresh;$('#result').innerHTML=resultMarkup(fresh);printUntil=Date.now()+3000;document.body.classList.add('print-authorized');window.print();document.body.classList.remove('print-authorized');printUntil=0;}
  if(b.dataset.grant){const enabled=b.dataset.enabled==='true';await rpc('number_character_set_access',{p_user_id:b.dataset.grant,p_enabled:enabled});if(ticket!==revision)return;members=await all('number_character_members');if(ticket!==revision)return;renderMembers();message(enabled?'已开通数字性格。':'已关闭数字性格，后续访问立即失效。');}
  if(b.dataset.history){const history=await rpc('number_character_history',{p_user_id:b.dataset.history});if(ticket!==revision)return;$('#history-'+b.dataset.history).innerHTML=history.length?history.map(h=>'<div>'+esc(new Date(h.created_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))+' · '+(h.enabled?'开通':'关闭')+'</div>').join(''):'暂无授权记录。';}
 }catch(error){if(ticket===revision)failure(error);}finally{feedback.finish();working=false;b.disabled=false;}
});
window.addEventListener('hashchange',()=>{if(viewer)navigate();});
window.addEventListener('beforeprint',()=>{if(Date.now()>printUntil)document.body.classList.remove('print-authorized');});
window.addEventListener('afterprint',()=>{printUntil=0;document.body.classList.remove('print-authorized');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(!printUntil){clearProtected();message('返回页面后重新核对权限。');}}else if(viewer)navigate();});
setInterval(verifyVisible,15000);
boot();
