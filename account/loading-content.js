// Only public reader content uses this deadline. Health/account requests keep their existing safeguards.
export async function readLoadingJSON(url,{signal,timeout=20000,...options}={}){
 const controller=new AbortController(),abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;abort();},timeout);
 try{const response=await fetch(url,{...options,signal:controller.signal});if(!response.ok)throw Error('content_unavailable');return await response.json();}
 catch(error){if(timedOut&&!signal?.aborted)throw Error('content_timed_out');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
