import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

export const person = {id:'test-user-a',email:'regression@example.invalid',email_confirmed_at:'2026-11-06T00:00:00Z'};
export const session = {access_token:'synthetic-token-a',refresh_token:'synthetic-refresh',user:person};
export const tick = async () => {for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));await new Promise(r=>setTimeout(r,5));};

// DOM simulation only. No browser, remote account, email delivery, or database access.
export async function appFixture(entry, {hash='',search='',initial=null,ua='',authOverrides={},rpcOverride}={}) {
  const {document,Event,CustomEvent}=parseHTML('<html><head></head><body><main id="app"></main><main id="account-app"></main><main id="workspace"></main><div id="modal-root"></div><div id="toast"></div><dialog id="dialog"></dialog></body></html>');
  if(entry.startsWith('team/'))document.querySelector('dialog').remove();
  const handlers=new Map(),calls=[],storage=new Map(),timers=new Set();
  const storageKey='sb-mdwbtgjyrdqfwupvadir-auth-token';
  let current=initial;
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
  if(initial)localStorage.setItem(storageKey,JSON.stringify(initial));
  const addEventListener=(n,f)=>{if(!handlers.has(n))handlers.set(n,[]);handlers.get(n).push(f);};
  const dispatchEvent=e=>{for(const f of handlers.get(e.type)||[])f(e);};
  const schedule=(f,ms=0)=>{const id=setTimeout(()=>{timers.delete(id);f();},ms);timers.add(id);return id;};
  let url=new URL('https://test.invalid/'+entry.replace(/[^/]+$/,'')+search+hash);
  const location={get href(){return url.href;},get origin(){return url.origin;},get pathname(){return url.pathname;},get search(){return url.search;},get hostname(){return url.hostname;},get hash(){return url.hash;},set hash(v){url.hash=v;schedule(()=>dispatchEvent({type:'hashchange'}));},assign:v=>calls.push(['assign',v]),reload:()=>calls.push(['reload'])};
  const history={replaceState:(_a,_b,v)=>{url=new URL(v,url);}};
  const authListeners=[];
  const emit=async(event,value)=>{current=value;if(value)localStorage.setItem(storageKey,JSON.stringify(value));else localStorage.removeItem(storageKey);for(const f of authListeners)f(event,value);await tick();};
  const auth={
    onAuthStateChange:f=>{authListeners.push(f);return {data:{subscription:{unsubscribe(){}}}};},
    getSession:async()=>({data:{session:current},error:null}),
    getUser:async token=>({data:{user:person},error:null}),
    signUp:async args=>{calls.push(['signUp',args]);return {data:{user:person,session:null},error:null};},
    signInWithPassword:async args=>{calls.push(['signIn',args]);await emit('SIGNED_IN',session);return {data:session,error:null};},
    resetPasswordForEmail:async(...args)=>{calls.push(['recover',...args]);return {data:{},error:null};},
    updateUser:async args=>{calls.push(['updateUser',args]);return {data:{user:person},error:null};},
    signOut:async()=>{await emit('SIGNED_OUT',null);return {error:null};},
    ...authOverrides
  };
  const db={auth,rpc:async(name,args)=>{
    calls.push(['rpc',name,args]);if(rpcOverride)return rpcOverride(name,args);
    return {data:name==='site_reader_context'?{display_name:'模拟读者',save_history:false,is_admin:false}:name==='team_context'?{team:null,membership:null}:[],error:null};
  },from:table=>{
    calls.push(['from',table]);const chain={};
    for(const m of ['select','eq','order','range','is','in'])chain[m]=()=>chain;
    chain.maybeSingle=async()=>({data:{id:current?.user.id,display_name:'模拟读者'},error:null});
    chain.then=(resolve,reject)=>Promise.resolve({data:[],error:null}).then(resolve,reject);return chain;
  }};
  const window={AFORM_CONFIG:{ready:true,url:'https://mdwbtgjyrdqfwupvadir.supabase.co',key:'sb_publishable_test'},supabase:{createClient:()=>db},location,history,localStorage,addEventListener,dispatchEvent,scrollTo(){}};
  class FormData {constructor(form){this.form=form;}get(name){const el=this.form.querySelector(`[name="${name}"]`);return !el?null:el.type==='checkbox'?(el.checked?'on':null):el.value;}has(name){return !!this.form.querySelector(`[name="${name}"]`);}}
  const context=vm.createContext({window,document,location,history,localStorage,addEventListener,dispatchEvent,Event,CustomEvent,FormData,URL,URLSearchParams,Headers,Request,AbortController,DOMException,navigator:{userAgent:ua},console,setTimeout:schedule,clearTimeout,setInterval:()=>0,clearInterval,requestAnimationFrame:f=>schedule(f),fetch:()=>{throw Error('Unexpected network: isolated test');},confirm:()=>false,crypto});
  const root=new URL('../',import.meta.url),modules=new Map();
  async function load(file){
    const key=fileURLToPath(file);if(modules.has(key))return modules.get(key);
    const pending=readFile(file,'utf8').then(source=>new vm.SourceTextModule(source,{context,identifier:file.href,initializeImportMeta:meta=>{meta.url=file.href;}}));
    modules.set(key,pending);return pending;
  }
  const module=await load(new URL(entry,root));await module.link((spec,parent)=>load(new URL(spec.split('?')[0],parent.identifier)));await module.evaluate();await tick();
  return {document,window,location,calls,auth,db,module,emit,localStorage,storageKey,dispatchEvent,
    async click(selector){document.querySelector(selector).click();await tick();},
    async submit(selector,values){const f=document.querySelector(selector);for(const [k,v]of Object.entries(values)){const el=f.querySelector(`[name="${k}"]`);if(el)el.value=v;}f.reset=()=>{for(const el of f.querySelectorAll('input'))el.value='';};const button=f.querySelector('[type=submit]');f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await tick();for(let i=0;i<30&&button?.disabled;i++)await tick();},
    close(){for(const id of timers)clearTimeout(id);}
  };
}
