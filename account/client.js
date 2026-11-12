import {loadAccountSdk} from './sdk.js?v=20261112-complete-1';
import {browserSessionStorage,sessionPersistence} from './session-storage.js?v=20261112-complete-1';
import {readPersonalProfile} from './profile.js?v=20261112-flow-1';
import {authIssue} from './auth-support.js?v=20261112-complete-1';
import {ANALYTICS_URL,ANALYTICS_KEY,OWNER_DEVICE_KEY} from '../analytics/config.js?v=20261031-20';
import {publicApiFetch} from '../zhongyi/aform/auth.js?v=20261112-flow-1';
import {connectedAccountInput} from './connection.js?v=20261112-stability-1';
export const storageKey='sb-'+new URL(ANALYTICS_URL).hostname.split('.')[0]+'-auth-token';
let promise,context=null,authRevision=0,pendingRefresh=null,lastSession=null;const listeners=new Set();
// This is an identity-change guard only; Auth and RLS still authorize every request.
export function sessionUserId(){const stored=browserSessionStorage.getItem(storageKey);if(!sessionPersistence())return lastSession?.user?.id||null;try{return JSON.parse(stored||'null')?.user?.id||null;}catch{return null;}}
export function hasSession(){return Boolean(sessionUserId());}
let activeUserId=sessionUserId();
function emit(){for(const fn of listeners)fn(context);window.dispatchEvent(new CustomEvent('hhq-account-change',{detail:{signedIn:Boolean(context),isAdmin:Boolean(context?.is_admin),saveHistory:Boolean(context?.save_history)}}));}
function syncIdentity(id=sessionUserId()){
 if(id===activeUserId)return;
 activeUserId=id;authRevision++;pendingRefresh=null;context=null;emit();
}
export function onAccount(fn){listeners.add(fn);fn(context);return()=>listeners.delete(fn);}
export function prepareAccount(){
 getClient().catch(()=>{});
 connectedAccountInput(ANALYTICS_URL+'/auth/v1/settings',ANALYTICS_KEY).catch(()=>{});
}
export async function getClient(){
 if(!promise)promise=(async()=>{
  await loadAccountSdk();
  let client;try{if(typeof window.supabase?.createClient!=='function')throw Error('账号组件未就绪');client=window.supabase.createClient(ANALYTICS_URL,ANALYTICS_KEY,{global:{fetch:publicApiFetch(ANALYTICS_KEY)},auth:{persistSession:true,storage:browserSessionStorage,autoRefreshToken:true,detectSessionInUrl:false}});}catch(error){if(!error.code)error.code=/网站连接参数无效/.test(error.message)?'client_config_invalid':'client_init_failed';throw error;}
  client.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'){lastSession=null;syncIdentity(null);if(context){context=null;emit();}}
   else if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED','INITIAL_SESSION'].includes(event)){
    lastSession=session||null;syncIdentity(session?.user?.id||null);
    if(event==='USER_UPDATED'){authRevision++;pendingRefresh=null;}
    if(event!=='INITIAL_SESSION')setTimeout(()=>refreshAccount().catch(()=>{}),0);
   }
  });return client;
 })().catch(error=>{promise=null;throw error;});return promise;
}
export function refreshAccount(){
 syncIdentity();const revision=authRevision;
 // Anonymous readers need no SDK download. An initialized SDK may hold an
 // in-memory session even when durable browser storage is unavailable.
 if(!activeUserId&&!promise)return Promise.resolve(null);
 if(pendingRefresh?.revision===revision)return pendingRefresh.promise;
 const work=(async()=>{
  const db=await getClient(),{data,error}=await db.auth.getSession();if(error)throw error;
  const session=data.session,userId=session?.user?.id||null;
  if(revision!==authRevision&&userId!==sessionUserId())return null;
  lastSession=session||null;syncIdentity(userId);if(!userId)return null;
  const readRevision=authRevision;
  const current=()=>readRevision===authRevision&&sessionUserId()===userId;
  const [r,personal]=await Promise.all([db.rpc('site_reader_context'),readPersonalProfile(db,{expectedUserId:userId})]);
  if(!current())return null;if(r.error)throw r.error;
  const next={...r.data,...personal.profile,user_id:personal.user.id};
  if(next.is_admin){let excluded=true;try{excluded=localStorage.getItem(OWNER_DEVICE_KEY)!=='no';if(excluded)localStorage.setItem(OWNER_DEVICE_KEY,'yes');}catch{}if(excluded)window.dispatchEvent(new Event('hhq-analytics-optout'));}
  if(JSON.stringify(context)!==JSON.stringify(next)){context=next;emit();}return context;
 })();
 const pending={revision,promise:work.finally(()=>{if(pendingRefresh===pending)pendingRefresh=null;})};
 pendingRefresh=pending;return pending.promise;
}
export async function readingAuthorization(){if(!context?.save_history)return null;const {data,error}=await(await getClient()).auth.getSession();return !error&&data.session?.user?.id===context.user_id?data.session.access_token:null;}
export async function signOut(){
 const {error}=await(await getClient()).auth.signOut({scope:'local'});
 // The bounded transport lets the SDK clear local credentials even when offline.
 if(error&&hasSession())throw error;
 authRevision++;pendingRefresh=null;activeUserId=null;lastSession=null;context=null;emit();
 return {remoteRevoked:!error};
}
export function friendly(error){return authIssue(error).text;}
addEventListener('storage',e=>{if(e.key===storageKey||e.key===null){syncIdentity();refreshAccount().catch(()=>{});}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAccount().catch(()=>{});});
