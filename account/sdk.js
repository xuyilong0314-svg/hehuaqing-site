// Load the vendored account SDK once per page, with a recoverable deadline.
export function createSdkLoader(win, doc, {timeoutMs=12000,setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  let pending;
  return function load() {
    if (typeof win.supabase?.createClient === 'function') return Promise.resolve(win.supabase);
    if (pending) return pending;
    const task = new Promise((resolve,reject) => {
      const script=doc.createElement('script');
      let settled=false;
      const finish=error=>{
        if(settled)return;settled=true;clearTimer(timer);script.onload=null;script.onerror=null;
        if(error){script.remove();reject(error);}else resolve(win.supabase);
      };
      const failure=code=>Object.assign(new Error(code==='client_load_timeout'?'账号组件加载较慢，请重试。':'账号组件没有加载完成。'),{code});
      const timer=setTimer(()=>finish(failure('client_load_timeout')),timeoutMs);
      script.src=new URL('../zhongyi/aform/supabase.js',import.meta.url).href;
      script.async=true;
      script.onload=()=>finish(typeof win.supabase?.createClient==='function'?null:failure('client_init_failed'));
      script.onerror=()=>finish(failure('client_load_failed'));
      doc.head.append(script);
    });
    pending=task.catch(error=>{pending=null;throw error;});
    return pending;
  };
}
let loader;
export function loadAccountSdk(){return (loader||(loader=createSdkLoader(window,document)))();}
