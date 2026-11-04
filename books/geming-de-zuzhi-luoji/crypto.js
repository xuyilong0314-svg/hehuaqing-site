export const AAD='hhq:geming-de-zuzhi-luoji:v1';
const bytes=value=>Uint8Array.from(atob(value),x=>x.charCodeAt(0));
export async function decryptBook(envelope,password){
 if(envelope.schema!==1||envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations!==600000||envelope.cipher!=='AES-256-GCM'||envelope.compression!=='gzip')throw Error('书籍格式不受支持');
 if(!globalThis.crypto?.subtle||!globalThis.DecompressionStream)throw Error('请使用新版 Safari、Chrome 或 Edge 打开');
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(envelope.salt),iterations:envelope.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
 let clear;try{clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv),additionalData:new TextEncoder().encode(AAD),tagLength:128},key,bytes(envelope.data));}catch{throw Error('密码不正确，或书籍副本需要重新保存');}
 const stream=new Blob([clear]).stream().pipeThrough(new DecompressionStream('gzip'));
 const book=JSON.parse(await new Response(stream).text());
 if(!Array.isArray(book.chapters)||book.chapters.length!==34)throw Error('书籍内容不完整');return book;
}
