import {sessionPersistence,temporarySessionNotice} from './session-storage.js?v=20261112-complete-1';
import {mountEmailPanel} from './email-status.js?v=20261112-deferred-1';
import {rememberPendingEmail,verificationUrl} from './verification.js?v=20261112-deferred-1';
import {profileFields,profileFromForm,signupFields,signupProfileFromForm,savePersonalProfile,syncStudyField,ProfileError} from './profile.js?v=20261112-flow-1';
import {authIssue,isWeChat,checkAuthConnection} from './auth-support.js?v=20261112-complete-1';
import {ANALYTICS_URL,ANALYTICS_KEY} from '../analytics/config.js?v=20261031-20';
import {authReturnUrl} from '../zhongyi/aform/auth.js?v=20261112-flow-1';
import {getClient,refreshAccount,signOut,friendly,hasSession,onAccount,storageKey,sessionUserId,prepareAccount} from './client.js?v=20261112-complete-1';
import {escapeHtml as esc} from '../analytics/metrics.js?v=20261031-20';
import {accountRequest,accountChanged} from './requests.js?v=20261112-flow-1';
const root=document.querySelector('#account-app');let mode='login',busy=false,profileDirty=false,context=null,history=[],view='loading',loadVersion=0,accountEpoch=0,editRevision=0,writeController=null;
const dirtyForms=new Set();
let historyState='idle',historyVersion=0,historyOwner=null,historyPending=null,historyController=null;
const date=t=>new Date(t).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
function message(text,error=false){const box=document.querySelector('#account-message');if(box){box.className='message'+(error?' error':'');box.textContent=text;box.hidden=false;if(error)box.scrollIntoView({block:'center'});}}

function showAuthError(error){
 const issue=authIssue(error),box=document.querySelector('#account-message');if(!box)return;
 box.className='message error';box.hidden=false;
 box.innerHTML='<p>'+esc(issue.text)+'</p><small class="auth-reference">问题编号：'+esc(issue.reference)+'</small>'+(issue.connection?'<div class="auth-help-actions"><button type="button" class="text-button" data-action="check-connection">检查账号连接</button><button type="button" class="text-button" data-action="copy-registration-link">复制注册网址</button></div>':'')+(isWeChat(navigator.userAgent)&&issue.connection?'<p class="auth-wechat-help">也可点微信右上角“⋯”，选择在浏览器中打开。请沿用原邮箱。</p>':'');
}
async function diagnoseConnection(){
 const box=document.querySelector('#connection-result');if(!box)return;
 box.hidden=false;box.textContent='正在检查账号连接…';
 const result=await checkAuthConnection({url:ANALYTICS_URL,key:ANALYTICS_KEY});
 box.textContent=result.text+'（'+result.reference+'）';
 if(result.ok){try{await getClient();}catch(error){const issue=authIssue(error);box.textContent='账号服务已连通，但网页组件尚未就绪。'+issue.text+'（'+issue.reference+'）';}}
}
async function copyRegistrationLink(){
 const url=new URL('./',location.href);url.search='';url.hash='';
 try{await navigator.clipboard.writeText(url.href);const box=document.querySelector('#connection-result');box.hidden=false;box.textContent='注册网址已复制，可粘贴到手机浏览器打开。';}
 catch{const box=document.querySelector('#connection-result');box.hidden=false;box.innerHTML='<span>请长按下方网址复制：</span><input class="public-registration-url" readonly aria-label="注册网址" value="'+esc(url.href)+'">';}
}

function passwordField(name,label,autocomplete,placeholder){
 const id='account-'+name;
 return `<div class="field"><label for="${id}">${label}</label><div class="password-control"><input id="${id}" name="${name}" type="password" required minlength="6" autocomplete="${autocomplete}" placeholder="${placeholder}"><button type="button" class="password-toggle" data-action="toggle-password" data-for="${id}" data-label="${label}" aria-controls="${id}" aria-label="显示${label}" aria-pressed="false">显示</button></div></div>`;
}
function login(note='',email=''){
 view='auth';prepareAccount();
 root.innerHTML=`<div class="auth-layout"><section class="auth-intro"><p class="eyebrow">何华清 · 我的账号</p><h1>${mode==='signup'?'从这里，开始。':'欢迎回来。'}</h1><p>一个账号，走进阅读、健康记录与团队协作。</p><p class="quote">读懂身体，<br>也读懂生活。</p></section><section class="auth-card"><div class="auth-tabs"><button type="button" data-mode="login" aria-pressed="${mode==='login'}">登录</button><button type="button" data-mode="signup" aria-pressed="${mode==='signup'}">注册</button></div><div id="account-message" role="status" ${note?'class="message"':'hidden'}>${esc(note)}</div>${!sessionPersistence()?'<p class="small">'+esc(temporarySessionNotice)+'</p>':''}<form id="account-form">${mode==='signup'?signupFields('signup'):''}<label class="field">邮箱<input name="email" type="email" required autocomplete="username" value="${esc(email)}" placeholder="能接收邮件的邮箱"></label>${mode==='signup'?'<p class="small">注册后即可登录，邮箱验证与详细资料可以到个人页稍后完成。</p>':''}${passwordField('password','密码',mode==='signup'?'new-password':'current-password','至少 6 位')}${mode==='signup'?passwordField('confirm','确认密码','new-password','再次输入密码')+'<label class="check"><input name="privacy" type="checkbox" required><span>我已阅读并同意<a href="../analytics/privacy.html" target="_blank" rel="noopener">隐私与阅读记录说明</a></span></label>':''}<button class="primary submit" type="submit">${mode==='signup'?'注册账号':'登录'}</button></form><div class="form-extra"><a href="../#home">先逛逛 →</a><a href="../zhongyi/aform/#/forgot">忘记密码</a></div><p class="small"><a href="./verify/">已有验证邮件？在这里完成验证</a></p><p class="small">已有上医健康服务档案或团队账号？使用同一邮箱和密码即可。</p><details class="account-help"><summary>登录或注册遇到问题？</summary><button type="button" class="text-button" data-action="check-connection">检查账号连接</button><button type="button" class="text-button" data-action="copy-registration-link">复制注册网址</button></details><div id="connection-result" class="connection-result" role="status" hidden></div></section></div>`;
}
function historyMarkup(){return `<h2>我的阅读</h2><p>最近 90 天的阅读足迹。书签与精确续读位置保留在当前浏览器。</p>${historyState==='loading'?'<p class="empty">正在读取阅读历史，您可以先使用其他功能。</p>':historyState==='error'?'<p class="empty">阅读历史暂未加载，不影响账号使用。</p><button type="button" class="secondary" data-action="retry-history">重新加载阅读历史</button>':history.length?history.map(item=>`<a class="history-row" href="${esc(item.href||'../#books')}"><div><strong>${esc(item.title)}</strong><small>${esc(item.book_title||'文章')} · 到达 ${Number(item.depth)||0}%</small></div><span class="when">${esc(date(item.last_read))}<br>再次打开 →</span></a>`).join(''):`<p class="empty">${context.save_history?'读过的书与文章，会出现在这里。':'开启“保存阅读历史”，下次在这里找回读过的内容。'}</p>`}`;}
function renderHistory(){const element=document.querySelector('#account-history');if(element&&view==='account')element.innerHTML=historyMarkup();}
function resetHistory(){historyVersion++;historyController?.abort();historyController=null;historyPending=null;historyOwner=null;history=[];historyState='idle';}
function loadHistory(db,userId,{force=false}={}){
 if(historyPending&&historyOwner===userId&&!force)return historyPending;
 historyController?.abort();const controller=new AbortController();historyController=controller;
 const version=++historyVersion,epoch=accountEpoch;historyOwner=userId;historyState='loading';renderHistory();
 const current=()=>version===historyVersion&&epoch===accountEpoch&&context?.user_id===userId&&sessionUserId()===userId&&view==='account';
 const work=(async()=>{
  try{
   let query=db.rpc('site_my_reading');if(typeof query.abortSignal==='function')query=query.abortSignal(controller.signal);
   const r=await query;if(!current())return;if(r.error)throw r.error;
   history=Array.isArray(r.data)?r.data:[];historyState='ready';renderHistory();
  }catch{if(current()){historyState='error';renderHistory();}}
 })();
 const pending=work.finally(()=>{if(historyPending===pending){historyPending=null;historyController=null;}});historyPending=pending;return pending;
}
function render(){
 view='account';
 profileDirty=false;dirtyForms.clear();
 root.innerHTML=`<div class="my-reading"><header class="my-heading"><div><p class="eyebrow">我的账号</p><h1>${esc(context.display_name)}，你好。</h1><p>阅读、健康记录与团队工作台，沿用同一次登录。</p></div><button class="text-button" data-action="logout">退出登录</button></header><nav class="account-destinations"><a class="primary" href="../#books">继续读书 →</a><a class="secondary" href="../zhongyi/aform/#/new">为新会员建档 ＋</a><a class="secondary" href="../zhongyi/aform/#/home">上医健康服务档案 ↗</a><a class="secondary" href="../team/">团队工作台 ↗</a>${context.is_admin?'<a class="secondary" href="../zhongyi/aform/#/students">会员账号管理 ↗</a><a class="secondary" href="../analytics/#/overview">网站管理台 ↗</a>':''}</nav><div id="account-message" role="status" hidden></div>${!sessionPersistence()?'<p class="message">'+esc(temporarySessionNotice)+'</p>':''}<section id="email-status" class="email-status" aria-label="邮箱验证"></section><form id="personal-profile" data-user-id="${esc(context.user_id)}" class="personal-profile"><h2>个人资料</h2><p>与上医档案共用，在任一入口修改都会同步。</p>${context.profile_version!==1?'<p class="profile-notice">请核对真实姓名，并补充您的学习情况。</p>':''}${profileFields(context,'account')}<button class="secondary" type="submit">保存资料</button></form><form id="reader-settings" data-user-id="${esc(context.user_id)}" class="settings reading-settings"><div><label class="check"><input type="checkbox" name="save_history" ${context.save_history?'checked':''}><span>保存阅读历史</span></label><small>记录方式与管理见<a href="../analytics/privacy.html#reading">阅读记录说明</a>。</small></div><button class="secondary" type="submit">保存设置</button></form><section id="account-history" class="history" aria-live="polite">${historyMarkup()}</section></div>`;
}
function connectionError(){
 if(!hasSession()){if(view!=='auth')login();message('连接暂未完成，请重试或先逛逛。',true);return;}
 view='connection';
 root.innerHTML='<div class="auth-layout"><section class="auth-intro"><p class="eyebrow">我的账号</p><h1>稍后，继续阅读。</h1><p>登录信息仍保留，请检查网络后重试。</p></section><section class="auth-card"><button class="primary submit" data-action="reconnect">重新连接</button><button class="text-button" data-action="logout">退出当前账号</button><div class="form-extra"><a href="../#home">先逛逛 →</a></div></section></div>';
}
function clearAccount(note='已退出当前浏览器账号。',force=false){
 loadVersion++;accountEpoch++;editRevision++;writeController?.abort();writeController=null;context=null;resetHistory();profileDirty=false;dirtyForms.clear();busy=false;
 if(force||view!=='auth'){mode='login';login(note);}
}
async function load({forceHistory=false}={}){
 const version=++loadVersion,epoch=accountEpoch,edit=editRevision;
 const current=()=>version===loadVersion&&epoch===accountEpoch;
 try{
  const next=await refreshAccount();if(!current())return;
  if(!next){context=null;resetHistory();if(view!=='auth')login();return;}
  const userId=next.user_id;if(userId!==sessionUserId())return;
  if(profileDirty||edit!==editRevision)return;
  if(context?.user_id!==userId)resetHistory();
  context=next;render();
  const db=await getClient();if(!current()||userId!==sessionUserId())return;
  mountEmailPanel(db,document.querySelector('#email-status'));
  // Secondary history never holds up the account or re-renders an edited form.
  loadHistory(db,userId,{force:forceHistory});
 }catch(error){if(current()&&!profileDirty&&edit===editRevision)throw error;}
}
function changedAccount(){
 if(context?.user_id&&sessionUserId()!==context.user_id){
  clearAccount(hasSession()?'账号已切换，正在读取当前账号…':'已退出当前浏览器账号。',true);
  if(hasSession())load().catch(connectionError);
  return true;
 }
 return false;
}
root.addEventListener('click',async e=>{const btn=e.target.closest('button');if(!btn||busy)return;if(btn.dataset.action==='retry-history'){if(context)loadHistory(await getClient(),context.user_id,{force:true});return;}if(btn.dataset.action==='check-connection'){busy=true;btn.disabled=true;try{await diagnoseConnection();}finally{busy=false;btn.disabled=false;}return;}if(btn.dataset.action==='copy-registration-link'){await copyRegistrationLink();return;}if(btn.dataset.action==='reconnect'){busy=true;btn.disabled=true;try{await load();}catch{connectionError();}finally{busy=false;btn.disabled=false;}return;}if(btn.dataset.action==='toggle-password'){const input=document.getElementById(btn.dataset.for);if(!input)return;const show=input.type==='password';input.type=show?'text':'password';btn.textContent=show?'隐藏':'显示';btn.setAttribute('aria-pressed',String(show));btn.setAttribute('aria-label',(show?'隐藏':'显示')+btn.dataset.label);return;}if(btn.dataset.mode){if(mode===btn.dataset.mode)return;const email=root.querySelector('[name=email]')?.value||'';mode=btn.dataset.mode;login('',email);root.querySelector('[data-mode="'+mode+'"]').focus();return;}if(btn.dataset.action==='logout'){clearAccount('正在退出当前浏览器账号…',true);busy=true;btn.disabled=true;try{await signOut();clearAccount('已退出当前浏览器账号。',true);}catch(error){if(!hasSession())clearAccount('已退出当前浏览器账号。',true);else message(friendly(error),true);}finally{busy=false;btn.disabled=false;}}});
root.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;const f=e.target,fields=new FormData(f),button=f.querySelector('button[type=submit]'),epoch=accountEpoch,edit=editRevision;busy=true;button.disabled=true;
 const originalLabel=button.textContent;button.textContent=f.id==='account-form'?(mode==='signup'?'正在注册…':'正在登录…'):'正在保存…';
 const slow=setTimeout(()=>{if(epoch===accountEpoch&&busy)button.textContent='连接较慢，请稍候…';},3000);
 try{
  const db=await getClient();if(epoch!==accountEpoch)return;
  if(f.id==='personal-profile'||f.id==='reader-settings'){if(!f.dataset.userId||f.dataset.userId!==context?.user_id||f.dataset.userId!==sessionUserId())throw accountChanged();writeController=new AbortController();}
  if(f.id==='personal-profile'){
   const saved=await savePersonalProfile(db,profileFromForm(f),{expectedUserId:f.dataset.userId,signal:writeController.signal});if(epoch!==accountEpoch)return;context={...context,...saved.profile};if(edit===editRevision)dirtyForms.delete(f.id);profileDirty=dirtyForms.size>0;if(!profileDirty){render();mountEmailPanel(db,document.querySelector('#email-status'));}refreshAccount().catch(()=>{});message(edit===editRevision?'资料已保存，网站账号与上医档案已同步。':'本次提交的资料已保存；您随后修改的内容还未保存。');
  }else if(f.id==='reader-settings'){
   await accountRequest(db,f.dataset.userId,'/rest/v1/rpc/set_site_reader_settings',{body:{p_display_name:context.display_name,p_save_history:fields.get('save_history')==='on'},signal:writeController.signal});if(epoch!==accountEpoch)return;context.save_history=fields.get('save_history')==='on';if(edit===editRevision)dirtyForms.delete(f.id);profileDirty=dirtyForms.size>0;if(!profileDirty)await load({forceHistory:true});message('设置已保存。');
  }else if(mode==='signup'){
   if(fields.get('password')!==fields.get('confirm')){message('两次密码不一致，请重新输入。',true);return;}
   const r=await db.auth.signUp({email:String(fields.get('email')).trim(),password:String(fields.get('password')),options:{data:signupProfileFromForm(f),emailRedirectTo:authReturnUrl(new URL('../zhongyi/aform/',location.href))}});if(r.error)throw r.error;f.reset();
   if(r.data.session){await load();message('注册成功，已为您登录。邮箱验证和详细资料可以稍后完成。');}else{rememberPendingEmail(fields.get('email'));location.assign(verificationUrl(location));}
  }else{
   const r=await db.auth.signInWithPassword({email:String(fields.get('email')).trim(),password:String(fields.get('password'))});if(r.error)throw r.error;f.reset();await load();
  }
 }catch(error){if(epoch!==accountEpoch)return;if(error?.code==='email_not_confirmed')rememberPendingEmail(fields.get('email'));if(error instanceof ProfileError)message(error.message,true);else if(f.id==='account-form'&&hasSession())connectionError();else if(f.id==='account-form')showAuthError(error);else message(friendly(error),true);}finally{clearTimeout(slow);if(epoch===accountEpoch){busy=false;writeController=null;}button.disabled=false;button.textContent=originalLabel;}
});
root.addEventListener('change',e=>{if(e.target.matches('[data-study-choice]'))syncStudyField(e.target);const f=e.target.closest('#personal-profile, #reader-settings');if(f){dirtyForms.add(f.id);profileDirty=true;editRevision++;}});
root.addEventListener('input',e=>{const f=e.target.closest('#personal-profile, #reader-settings');if(f){dirtyForms.add(f.id);profileDirty=true;editRevision++;}});
let subscribed=false;
onAccount(next=>{if(!subscribed){subscribed=true;return;}if(changedAccount())return;if(!next){if(view==='account'||view==='connection')clearAccount();}else if(!context&&view==='auth'&&!busy)load().catch(connectionError);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;if(changedAccount())return;if(!hasSession()){if(view!=='auth')clearAccount();return;}if(!busy&&!profileDirty)load().catch(connectionError);});
addEventListener('storage',e=>{if(e.key!==storageKey&&e.key!==null)return;if(changedAccount())return;if(!hasSession()){if(view!=='auth')clearAccount();return;}if(!busy&&!profileDirty)load().catch(connectionError);});
addEventListener('online',()=>{if(!busy&&!profileDirty&&hasSession())load().catch(connectionError);});
load().catch(connectionError);


