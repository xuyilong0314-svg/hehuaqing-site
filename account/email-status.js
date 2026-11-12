import {verificationUrl,confirmationError} from './verification.js?v=20261112-deferred-1';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function emailStatus(db){
  const {data,error}=await db.rpc('site_email_status');if(error)throw error;
  if(!data||typeof data.verified!=='boolean'||!data.email)throw Error('email_status_unavailable');
  return data;
}
export async function completeEmailVerification(db,expectedUserId){
  const {data:session,error:sessionError}=await db.auth.getSession();if(sessionError)throw sessionError;
  const token=session?.session?.access_token;if(!token)throw {code:'confirmation_incomplete'};
  const {data,error}=await db.auth.getUser(token);if(error)throw error;
  const user=data?.user;
  if(!user||user.id!==session.session.user.id||(expectedUserId&&user.id!==expectedUserId))throw {code:'verification_account_mismatch'};
  const result=await db.rpc('complete_site_email_verification');if(result.error)throw result.error;
  if(result.data?.verified!==true||result.data.email.toLowerCase()!==user.email?.toLowerCase())throw {code:'confirmation_incomplete'};
  return {user,status:result.data,session:session.session};
}
export async function requestEmailVerification(db,location,expectedEmail){
  const {data,error}=await db.auth.getUser();if(error)throw error;
  const user=data?.user;if(!user?.id||!user.email)throw {code:'login_required'};
  if(expectedEmail&&user.email.toLowerCase()!==expectedEmail.toLowerCase())throw {code:'verification_account_mismatch'};
  const status=await emailStatus(db);
  if(status.email.toLowerCase()!==user.email.toLowerCase())throw {code:'verification_account_mismatch'};
  if(status.verified)return {alreadyVerified:true,user};
  const response=await db.auth.signInWithOtp({email:user.email,options:{shouldCreateUser:false,emailRedirectTo:verificationUrl(location)}});
  if(response.error)throw response.error;
  return {alreadyVerified:false,user};
}
export function emailError(error){
  if(error?.code==='login_required')return '请先登录，再验证您的邮箱。';
  if(error?.code==='verification_account_mismatch')return '这封邮件与当前登录的账号不同。请返回个人页，确认账号后再验证。';
  if(error?.message?.includes('email_proof_required'))return '还没有收到有效的邮件验证凭证。请打开最新邮件中的链接后再确认。';
  if(error?.status===429||String(error?.code||'').startsWith('over_'))return '邮件发送或验证暂时受限，请稍后再试。您的账号已注册，可以继续使用。';
  return confirmationError(error);
}
export async function mountEmailPanel(db,element,location=globalThis.location){
  if(!element)return;
  element.innerHTML='<h2>邮箱验证</h2><p role="status">正在读取邮箱状态…</p>';
  let status;
  try{status=await emailStatus(db);}catch{
    if(element.isConnected)element.innerHTML='<h2>邮箱验证</h2><p>暂时无法读取邮箱状态，不影响继续使用账号。</p><button type="button" class="secondary" data-email-retry>重试</button>';
    element.querySelector('[data-email-retry]')?.addEventListener('click',()=>mountEmailPanel(db,element,location));return;
  }
  if(!element.isConnected)return;
  element.innerHTML='<div class="email-heading"><h2>邮箱验证</h2><span class="email-badge '+(status.verified?'verified':'')+'">'+(status.verified?'已验证':'尚未验证')+'</span></div><p class="email-address">'+esc(status.email)+'</p>'+(status.verified?'<p>已确认这个邮箱由您使用。</p>':'<p>账号已经注册，可以先使用。方便时验证邮箱，便于找回密码和接收账号通知。</p><button type="button" class="secondary" data-send-email>验证邮箱</button><a class="email-link" href="'+esc(verificationUrl(location))+'">已有验证邮件？</a><p class="email-feedback" role="status" aria-live="polite"></p>');
  const button=element.querySelector('[data-send-email]');if(!button)return;
  let remaining=0,timer;
  const tick=()=>{if(!element.isConnected){clearInterval(timer);return;}remaining--;button.textContent=remaining>0?remaining+' 秒后可重新发送':'重新发送验证邮件';button.disabled=remaining>0;if(remaining<=0)clearInterval(timer);};
  button.addEventListener('click',async()=>{
    if(button.disabled)return;button.disabled=true;button.textContent='正在发送…';
    const feedback=element.querySelector('.email-feedback');
    try{
      const result=await requestEmailVerification(db,location,status.email);
      if(result.alreadyVerified){await mountEmailPanel(db,element,location);return;}
      feedback.textContent='请求已提交，请查看收件箱和垃圾箱，打开最新邮件中的链接完成验证。您也可以稍后再验证。';
      remaining=60;button.textContent='60 秒后可重新发送';timer=setInterval(tick,1000);
    }catch(error){feedback.textContent=emailError(error);button.disabled=false;button.textContent='重新发送验证邮件';}
  });
}
