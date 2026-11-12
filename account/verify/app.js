import {ANALYTICS_URL,ANALYTICS_KEY} from '../../analytics/config.js?v=20261031-20';
import {publicApiFetch,authReturnUrl} from '../../zhongyi/aform/auth.js?v=20261112-connection-1';
import {pendingEmail,forgetPendingEmail,readVerificationLink,linkCredentials,confirmEmail,resendConfirmation} from '../verification.js?v=20261112-deferred-1';
import {emailStatus,completeEmailVerification,requestEmailVerification,emailError} from '../email-status.js?v=20261112-deferred-1';
const $=id=>document.getElementById(id);
const hash=new URLSearchParams(location.hash.slice(1));
let credentials=readVerificationLink(location),returnedSession=null,currentUser=null,persistent,temporary,busy=false,resendAt=0;
const callbackError=hash.has('error')||hash.has('error_code');
if(hash.has('access_token')&&hash.has('refresh_token')&&['magiclink','signup','email'].includes(hash.get('type'))){
  returnedSession={access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token')};
}
// Credentials stay in memory and SDK session storage only; never log them.
if(location.hash||location.search)history.replaceState(null,'',location.pathname);
function notice(text,error=false){$('notice').hidden=false;$('notice').className=error?'error':'';$('notice').textContent=text;}
function buttons(){
  document.querySelectorAll('button').forEach(b=>b.disabled=busy);
  const remaining=Math.max(0,Math.ceil((resendAt-Date.now())/1000));
  $('resend').disabled=busy||remaining>0;$('resend').textContent=remaining?remaining+' 秒后可重新发送':'发送验证邮件';
}
function createClient(persist){
  if(typeof window.supabase?.createClient!=='function')throw {code:'client_load_failed'};
  const timedFetch=async(input,init={})=>{
    const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,15000);
    init.signal?.addEventListener('abort',abort,{once:true});if(init.signal?.aborted)abort();
    try{return await fetch(input,{...init,signal:controller.signal});}finally{clearTimeout(timer);init.signal?.removeEventListener('abort',abort);}
  };
  return window.supabase.createClient(ANALYTICS_URL,ANALYTICS_KEY,{global:{fetch:publicApiFetch(ANALYTICS_KEY,timedFetch)},auth:{persistSession:persist,autoRefreshToken:persist,detectSessionInUrl:false,...(!persist?{storageKey:'hhq-email-verification-in-memory'}:{})}});
}
const db=()=>persistent||(persistent=createClient(true));
const temp=()=>temporary||(temporary=createClient(false));
function success(){
  credentials=null;returnedSession=null;forgetPendingEmail();$('code').value='';
  $('title').textContent='邮箱已验证';document.title='邮箱已验证 · 何华清';$('intro').textContent='已确认这个邮箱由您使用，验证结果已保存到个人页。';
  $('notice').hidden=true;$('link-confirm').hidden=true;$('forms').hidden=true;$('login-help').hidden=true;$('success').hidden=false;
  document.querySelector('.mark').textContent='✓';$('title').focus();
}
async function run(action){if(busy)return;busy=true;buttons();try{await action();}catch(error){notice(emailError(error),true);}finally{busy=false;buttons();}}
async function finish(link){
  notice('正在确认邮箱，请稍候…');
  const existing=await db().auth.getSession();if(existing.error)throw existing.error;
  const expected=existing.data?.session?.user?.id;
  if(returnedSession){
    const checked=await temp().auth.getUser(returnedSession.access_token);if(checked.error)throw checked.error;
    if(expected&&checked.data?.user?.id!==expected)throw {code:'verification_account_mismatch'};
    const restored=await temp().auth.setSession(returnedSession);if(restored.error)throw restored.error;
  }else{
    if(!link||link.invalid)throw {code:'otp_expired'};
    const user=await confirmEmail(temp().auth,link);
    if(expected&&user.id!==expected)throw {code:'verification_account_mismatch'};
    const recovered=await temp().auth.getSession();if(recovered.error)throw recovered.error;
    returnedSession=recovered.data?.session;
  }
  const result=await completeEmailVerification(temp(),expected);
  const saved=await db().auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});if(saved.error)throw saved.error;
  success();
}
$('confirm-link').addEventListener('click',()=>run(()=>finish(credentials)));
$('code-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{returnedSession=null;await finish(linkCredentials($('code').value));});});
$('resend').addEventListener('click',()=>{
  if(Date.now()<resendAt)return;
  run(async()=>{
    if(currentUser){
      const result=await requestEmailVerification(db(),location,currentUser.email);if(result.alreadyVerified){success();return;}
    }else{
      // Compatibility for an old, unconfirmed signup during deployment.
      await resendConfirmation(db().auth,$('email').value,authReturnUrl(location));
    }
    resendAt=Date.now()+60000;notice('请求已提交，请查看收件箱和垃圾箱，打开最新邮件中的链接。账号已经可以登录时，也可稍后再验证。');
  });
});
async function init(){
  $('email').value=pendingEmail();
  if(callbackError)notice('这条邮件链接已过期或无法使用。请先登录，再从个人页发送新的验证邮件。',true);
  if(credentials?.invalid)notice('这条验证链接不完整，请使用最新邮件。',true);
  if(returnedSession||(credentials&&!credentials.invalid)){
    $('link-confirm').hidden=false;$('intro').textContent='请确认要使用这封邮件验证您的邮箱。无需重新注册或设置密码。';
  }
  const r=await db().auth.getSession();if(r.error)throw r.error;
  if(r.data?.session){const checked=await db().auth.getUser();if(checked.error)throw checked.error;currentUser=checked.data?.user;}
  if(currentUser){
    $('email').value=currentUser.email;$('email').readOnly=true;
    if(!returnedSession&&!credentials&&!callbackError){const state=await emailStatus(db());if(state.verified)success();}
  }else if(!returnedSession&&!credentials){$('intro').textContent='请先登录，在个人页选择“验证邮箱”。已有验证邮件，也可在下方粘贴链接完成验证。';}
}
setInterval(buttons,1000);
run(init);
