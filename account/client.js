import {ANALYTICS_URL,ANALYTICS_KEY,OWNER_DEVICE_KEY} from '../analytics/config.js?v=20261031-20';
import {publicApiFetch} from '../zhongyi/aform/auth.js';
export const storageKey='sb-'+new URL(ANALYTICS_URL).hostname.split('.')[0]+'-auth-token';
let promise,context=null;const listeners=new Set();
export function hasSession(){try{return Boolean(localStorage.getItem(storageKey));}catch{return false;}}
function emit(){for(const fn of listeners)fn(context);window.dispatchEvent(new CustomEvent('hhq-account-change',{detail:{signedIn:Boolean(context),isAdmin:Boolean(context?.is_admin),saveHistory:Boolean(context?.save_history)}}));}
export function onAccount(fn){listeners.add(fn);fn(context);return()=>listeners.delete(fn);}
export async function getClient(){
 if(!promise)promise=(async()=>{
  if(!window.supabase)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('../zhongyi/aform/supabase.js',import.meta.url);s.onload=resolve;s.onerror=()=>reject(Error('连接未成功，请稍后再试。'));document.head.append(s);});
  const client=window.supabase.createClient(ANALYTICS_URL,ANALYTICS_KEY,{global:{fetch:publicApiFetch(ANALYTICS_KEY)},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){context=null;emit();}else if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event))setTimeout(()=>refreshAccount().catch(()=>{}),0);});return client;
 })().catch(error=>{promise=null;throw error;});return promise;
}
export async function refreshAccount(){
 if(!hasSession()){if(context){context=null;emit();}return null;}
 const db=await getClient(),{data:session,error}=await db.auth.getSession();if(error)throw error;
 if(!session.session){context=null;emit();return null;}
 const r=await db.rpc('site_reader_context');if(r.error)throw r.error;const next=r.data;
 if(next.is_admin){let excluded=true;try{excluded=localStorage.getItem(OWNER_DEVICE_KEY)!=='no';if(excluded)localStorage.setItem(OWNER_DEVICE_KEY,'yes');}catch{}if(excluded)window.dispatchEvent(new Event('hhq-analytics-optout'));}
 if(JSON.stringify(context)!==JSON.stringify(next)){context=next;emit();}return context;
}
export async function readingAuthorization(){if(!context?.save_history)return null;const {data,error}=await(await getClient()).auth.getSession();return !error&&data.session?data.session.access_token:null;}
export async function signOut(){const {error}=await(await getClient()).auth.signOut({scope:'local'});if(error)throw error;context=null;emit();}
export function friendly(error){const m=error?.message||'';if(/Invalid login/i.test(m))return '邮箱或密码不正确，请重新输入。';if(/Email not confirmed/i.test(m))return '请先完成邮箱验证，再登录。';if(/already registered/i.test(m))return '这个邮箱已注册，可以直接登录。';if(/rate limit|too many/i.test(m))return '操作较频繁，请稍后再试。';if(/password/i.test(m))return '请使用至少 6 位密码。';return '暂时未能完成，请检查网络后重试。';}
addEventListener('storage',e=>{if(e.key===storageKey)refreshAccount().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAccount().catch(()=>{});});
