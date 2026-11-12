// The SDK and UI share this adapter. If durable storage is unavailable, the
// current page keeps an in-memory session; credentials never go into URLs.
export function createSessionStorage(provider=()=>globalThis.localStorage) {
  const memory=new Map();let storage,checked=false,persistent=false;
  function check(){
    if(checked)return;checked=true;
    try{
      storage=provider();const probe='hhq-session-check-'+Math.random().toString(36).slice(2);
      storage.setItem(probe,'1');storage.removeItem(probe);persistent=true;
    }catch{persistent=false;}
  }
  return {
    getItem(key){check();if(persistent){try{const value=storage.getItem(key);if(value===null)memory.delete(key);else memory.set(key,value);return value;}catch{persistent=false;}}return memory.get(key)||null;},
    setItem(key,value){check();memory.set(key,value);if(persistent){try{storage.setItem(key,value);}catch{persistent=false;}}},
    removeItem(key){check();memory.delete(key);try{storage?.removeItem(key);}catch{persistent=false;}},
    isPersistent(){check();return persistent;}
  };
}
export const browserSessionStorage=createSessionStorage();
export const sessionPersistence=()=>browserSessionStorage.isPersistent();
export const temporarySessionNotice='当前浏览器暂不能保存登录状态；刷新或离开此页后可能需要重新登录。';
