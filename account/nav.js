import {onAccount,refreshAccount} from './client.js?v=20261105-reading-1';
let account=null,scheduled=false;const base=new URL('../',import.meta.url);
const accountURL=new URL('account/',base).href,adminURL=new URL('analytics/#/overview',base).href;
function anchor(label,href,klass){const a=document.createElement('a');a.textContent=label;a.href=href;a.className=klass;return a;}
function dismissed(){try{return Date.now()-Number(localStorage.getItem('hhq-login-prompt-dismissed')||0)<30*86400000;}catch{return false;}}
function dismiss(){try{localStorage.setItem('hhq-login-prompt-dismissed',String(Date.now()));}catch{}document.querySelector('.reader-welcome')?.remove();}
function update(){
 scheduled=false;const nav=document.querySelector('#site-navigation')||document.querySelector('.entry-header nav');
 if(nav){let a=nav.querySelector('[data-account-link]');if(!a){a=anchor('',accountURL,'account-nav');a.dataset.accountLink='true';nav.append(a);}const label=account?'我的阅读':'登录 / 注册';if(a.textContent!==label)a.textContent=label;
 let admin=nav.querySelector('[data-owner-link]');if(account?.is_admin&&!admin){admin=anchor('管理台',adminURL,'owner-nav');admin.dataset.ownerLink='true';nav.append(admin);}if(!account?.is_admin&&admin)admin.remove();}
 let footer=document.querySelector('#site-utilities');if(!footer){footer=document.createElement('div');footer.id='site-utilities';footer.append(anchor('隐私与阅读记录',new URL('analytics/privacy.html',base),'privacy-link'),anchor('管理登录',adminURL,'admin-footer-link'));document.body.append(footer);}
 const label=account?.is_admin?'网站管理台':'管理登录',link=footer.querySelector('.admin-footer-link');if(link.textContent!==label)link.textContent=label;
 const home=location.hash==='#home',banner=document.querySelector('.reader-welcome');
 if(account||!home||dismissed()){if(banner)banner.remove();return;}
 if(!banner){const target=document.querySelector('.home-hero');if(!target)return;const box=document.createElement('aside');box.className='reader-welcome';box.setAttribute('aria-label','登录提示');const copy=document.createElement('div'),strong=document.createElement('strong');strong.textContent='留一页，给下次。';const p=document.createElement('p');p.textContent='一个账号，阅读、健康记录与团队协作。';copy.append(strong,p);const actions=document.createElement('div');actions.append(anchor('登录 / 注册',accountURL,'reader-login-button'));const skip=document.createElement('button');skip.type='button';skip.textContent='先逛逛';skip.onclick=dismiss;actions.append(skip);box.append(copy,actions);target.append(box);}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update);}
const localPath=location.pathname.startsWith(base.pathname)?location.pathname.slice(base.pathname.length):'';
if(!/^(zhongyi\/aform|team)(\/|$)/.test(localPath)){
 if(!document.querySelector('link[data-account-style]')){const s=document.createElement('link');s.rel='stylesheet';s.href=new URL('nav.css?v=20261105-reading-1',import.meta.url);s.dataset.accountStyle='true';document.head.append(s);}
 onAccount(value=>{account=value;schedule();});refreshAccount().catch(()=>{});
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});addEventListener('hashchange',schedule);schedule();
}
