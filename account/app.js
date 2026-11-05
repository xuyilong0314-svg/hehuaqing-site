import {getClient,refreshAccount,signOut,friendly} from './client.js?v=20261105-reading-1';
import {escapeHtml as esc} from '../analytics/metrics.js?v=20261031-20';
const root=document.querySelector('#account-app');let mode='login',busy=false,context=null,history=[];
const date=t=>new Date(t).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
function message(text,error=false){const box=document.querySelector('#account-message');if(box){box.className='message'+(error?' error':'');box.textContent=text;box.hidden=false;}}
function login(note=''){
 root.innerHTML=`<div class="auth-layout"><section class="auth-intro"><p class="eyebrow">何华清 · 我的账号</p><h1>${mode==='signup'?'从这里，开始。':'欢迎回来。'}</h1><p>一个账号，走进阅读、健康记录与团队协作。</p><p class="quote">读懂身体，<br>也读懂生活。</p></section><section class="auth-card"><div class="auth-tabs"><button type="button" data-mode="login" aria-pressed="${mode==='login'}">登录</button><button type="button" data-mode="signup" aria-pressed="${mode==='signup'}">注册</button></div><div id="account-message" role="status" ${note?'class="message"':'hidden'}>${esc(note)}</div><form id="account-form">${mode==='signup'?'<label class="field">昵称<input name="display_name" type="text" required maxlength="40" autocomplete="nickname" placeholder="怎么称呼你"></label>':''}<label class="field">邮箱<input name="email" type="email" required autocomplete="username" placeholder="请输入邮箱"></label><label class="field">密码<input name="password" type="password" required minlength="6" autocomplete="${mode==='signup'?'new-password':'current-password'}" placeholder="至少 6 位"></label>${mode==='signup'?'<label class="field">确认密码<input name="confirm" type="password" required minlength="6" autocomplete="new-password" placeholder="再次输入密码"></label><label class="check"><input name="privacy" type="checkbox" required><span>我已阅读并同意<a href="../analytics/privacy.html" target="_blank" rel="noopener">隐私与阅读记录说明</a></span></label>':''}<button class="primary submit" type="submit">${mode==='signup'?'注册账号':'登录'}</button></form><div class="form-extra"><a href="../#home">先逛逛 →</a><a href="../zhongyi/aform/#/auth">忘记密码</a></div><p class="small">已有 A 表或团队账号？使用同一邮箱和密码即可。</p></section></div>`;
}
function render(){
 root.innerHTML=`<div class="my-reading"><header class="my-heading"><div><p class="eyebrow">我的账号</p><h1>${esc(context.display_name)}，你好。</h1><p>阅读、健康记录与团队工作台，沿用同一次登录。</p></div><button class="text-button" data-action="logout">退出登录</button></header><nav class="account-destinations"><a class="primary" href="../#books">继续读书 →</a><a class="secondary" href="../zhongyi/aform/#/new">为新会员建档 ＋</a><a class="secondary" href="../zhongyi/aform/#/home">健康记录 ↗</a><a class="secondary" href="../team/">团队工作台 ↗</a>${context.is_admin?'<a class="secondary" href="../analytics/#/overview">网站管理台 ↗</a>':''}</nav><div id="account-message" role="status" hidden></div><form id="reader-settings" class="settings"><label class="field">阅读昵称<input name="display_name" type="text" value="${esc(context.display_name)}" required maxlength="40" autocomplete="nickname"></label><div><label class="check"><input type="checkbox" name="save_history" ${context.save_history?'checked':''}><span>保存阅读历史</span></label><small>记录方式与管理见<a href="../analytics/privacy.html#reading">阅读记录说明</a>。</small></div><button class="secondary" type="submit">保存设置</button></form><section class="history"><h2>我的阅读</h2><p>最近 90 天的阅读足迹。书签与精确续读位置保留在当前浏览器。</p>${history.length?history.map(item=>`<a class="history-row" href="${esc(item.href||'../#books')}"><div><strong>${esc(item.title)}</strong><small>${esc(item.book_title||'文章')} · 到达 ${Number(item.depth)||0}%</small></div><span class="when">${esc(date(item.last_read))}<br>再次打开 →</span></a>`).join(''):`<p class="empty">${context.save_history?'读过的书与文章，会出现在这里。':'开启“保存阅读历史”，下次在这里找回读过的内容。'}</p>`}</section></div>`;
}
async function load(){context=await refreshAccount();if(!context){login();return;}const r=await(await getClient()).rpc('site_my_reading');if(r.error)throw r.error;history=r.data;render();}
root.addEventListener('click',async e=>{const btn=e.target.closest('button');if(!btn||busy)return;if(btn.dataset.mode){mode=btn.dataset.mode;login();}if(btn.dataset.action==='logout'){busy=true;btn.disabled=true;try{await signOut();context=null;history=[];mode='login';login('已退出全站账号。');}catch(error){message(friendly(error),true);}finally{busy=false;btn.disabled=false;}}});
root.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;const f=e.target,fields=new FormData(f),button=f.querySelector('button[type=submit]');busy=true;button.disabled=true;
 try{
  const db=await getClient();
  if(f.id==='reader-settings'){
   const r=await db.rpc('set_site_reader_settings',{p_display_name:String(fields.get('display_name')).trim(),p_save_history:fields.get('save_history')==='on'});if(r.error)throw r.error;await load();message('设置已保存。');
  }else if(mode==='signup'){
   if(fields.get('password')!==fields.get('confirm')){message('两次密码不一致，请重新输入。',true);return;}
   const r=await db.auth.signUp({email:String(fields.get('email')).trim(),password:String(fields.get('password')),options:{data:{display_name:String(fields.get('display_name')).trim()},emailRedirectTo:new URL('../zhongyi/aform/',location.href).href}});if(r.error)throw r.error;f.reset();
   if(r.data.session)await load();else{mode='login';login('请查收邮箱中的验证邮件。验证完成后，即可使用同一账号进入全站。');}
  }else{
   const r=await db.auth.signInWithPassword({email:String(fields.get('email')).trim(),password:String(fields.get('password'))});if(r.error)throw r.error;f.reset();await load();
  }
 }catch(error){message(friendly(error),true);}finally{busy=false;button.disabled=false;}
});
addEventListener('storage',()=>{if(!busy)load().catch(()=>message('账号状态暂未更新，请刷新重试。',true));});
load().catch(()=>{login();message('连接暂未完成，可以重试登录或先逛逛。',true);});
