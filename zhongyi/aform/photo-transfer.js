// Both fixed endpoints belong to the existing private Supabase project.
// Never forward credentials to caller-supplied hosts, cache images or use an admin key.
export const PHOTO_ORIGINS=['https://mdwbtgjyrdqfwupvadir.storage.supabase.co','https://mdwbtgjyrdqfwupvadir.supabase.co'];
const bucket='case-photos';
const uuid='[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}';
const pathPattern=new RegExp('^'+uuid+'/'+uuid+'\\.jpg$');
export const photoFailure=(code,status=0)=>Object.assign(new Error(code),{code,status});
function checkSignal(signal){if(signal?.aborted)throw new DOMException('上传已停止','AbortError');}
export function photoUploadMessage(error){
 const code=error?.code||'',status=Number(error?.status||error?.statusCode)||0,message=String(error?.message||error||'');
 if(error?.name==='AbortError'||code==='photo_account_changed')return '账号或页面已变化，上传已停止。请确认登录账号后重新打开档案。';
 if(status===401||code==='photo_login_required')return '登录状态需要重新确认。请先保留本页填写内容，再重新登录。';
 if(status===403||/row.level|permission|Unauthorized/i.test(message))return '当前账号没有保存这张照片的权限，请确认是自己的客户档案且已取得照片保存授权。';
 if(status===413||code==='photo_too_large')return '这张照片较大，请选择较小的照片后重试。';
 if(code==='photo_timeout')return '照片传输超时，尚未确认保存。照片仍保留在本页，稍后重试会先核对已上传结果。';
 if(code==='photo_network'||/Load failed|Failed to fetch|NetworkError|network request|connection.*failed/i.test(message))return '照片连接中断，尚未确认保存。已尝试可用上传入口；请保持本页，切换 Wi-Fi 或移动数据后点“重试未成功照片”。';
 if(code==='photo_mismatch')return '云端照片与本次文件不一致，已停止保存。请移出这张待传照片，重新选择。';
 if(code==='photo_unconfirmed')return '照片可能已送达，但保存结果尚未确认。请保留本页并重试，系统会核对同一张照片，不会重复建档。';
 if(status>=500)return '照片服务暂时未响应。照片仍保留在本页，请稍后重试。';
 return '照片尚未保存，请保留本页后重试。若仍失败，可复制排查信息交给管理员。';
}
export function xhrPhotoRequest(url,{method='GET',headers={},body,signal,onProgress,timeout=45000,binary=false}={},factory=()=>new XMLHttpRequest()){
 return new Promise((resolve,reject)=>{
  checkSignal(signal);const xhr=factory();let settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',abort);xhr.onload=xhr.onerror=xhr.ontimeout=xhr.onabort=null;if(xhr.upload)xhr.upload.onprogress=null;error?reject(error):resolve(value);};
  const abort=()=>{xhr.abort();finish(new DOMException('上传已停止','AbortError'));};
  xhr.open(method,url,true);xhr.timeout=timeout;xhr.withCredentials=false;xhr.responseType=binary?'arraybuffer':'text';
  for(const [key,value] of Object.entries(headers))xhr.setRequestHeader(key,value);
  if(xhr.upload&&onProgress)xhr.upload.onprogress=event=>{if(event.lengthComputable&&!settled)onProgress(event.loaded,event.total);};
  xhr.onload=()=>{if(!xhr.status){finish(photoFailure('photo_network'));return;}let data=xhr.response;if(!binary){try{data=JSON.parse(xhr.responseText);}catch{data=null;}}finish(null,{status:xhr.status,data});};
  xhr.onerror=()=>finish(photoFailure('photo_network'));xhr.ontimeout=()=>{xhr.abort();finish(photoFailure('photo_timeout'));};xhr.onabort=()=>finish(signal?.aborted?new DOMException('上传已停止','AbortError'):photoFailure('photo_timeout'));
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}
  try{xhr.send(body??null);}catch{finish(photoFailure('photo_network'));}
 });
}
function duplicate(response){return response.status===409||['Duplicate','ResourceAlreadyExists'].includes(response.data?.code)||/already exists/i.test(response.data?.message||'');}
function accepted(response){return response.status>=200&&response.status<300;}
function statusError(response){return photoFailure(response.status>=500?'photo_network':'photo_rejected',Number(response.data?.statusCode)||response.status);}
// This operation has one immutable random path and never overwrites an object.
// A missing response is reconciled by reading exactly that object before any retry.
export async function transferPhoto({db,key,item,expectedUserId,signal,phase=()=>{},progress=()=>{},request=xhrPhotoRequest}){
 if(!pathPattern.test(item.path)||!key?.startsWith('sb_publishable_')||!item.blob?.size)throw photoFailure('photo_invalid_input');
 if(item.blob.size>10*1024*1024)throw photoFailure('photo_too_large');
 checkSignal(signal);phase('connecting');
 const result=await db.auth.getSession();checkSignal(signal);if(result.error)throw result.error;
 const session=result.data?.session;if(!session?.access_token)throw photoFailure('photo_login_required');
 if(!expectedUserId||session.user?.id!==expectedUserId)throw photoFailure('photo_account_changed');
 const headers={apikey:key,Authorization:'Bearer '+session.access_token};
 const objectPath='/storage/v1/object/'+bucket+'/'+item.path;
 let lastError=photoFailure('photo_network');
 const verify=async origin=>{
  phase('checking');const response=await request(origin+'/storage/v1/object/authenticated/'+bucket+'/'+item.path,{headers,signal,binary:true,timeout:20000});checkSignal(signal);
  if(!accepted(response)){if([400,404].includes(response.status)&&['NoSuchKey','not_found','ObjectNotFound'].includes(response.data?.code))return false;if(response.status===404||response.status===400)return false;throw statusError(response);}
  const bytes=new Uint8Array(response.data),expected=new Uint8Array(await item.blob.arrayBuffer());checkSignal(signal);
  if(bytes.length!==expected.length||bytes.some((value,index)=>value!==expected[index]))throw photoFailure('photo_mismatch');return true;
 };
 for(let index=0;index<PHOTO_ORIGINS.length;index++){
  checkSignal(signal);const origin=PHOTO_ORIGINS[index];item.connection=index?'alternate':'direct';
  try{
   // After a failed/lost reply, reconcile before resending the same immutable object.
   if(item.uploadAttempted&&await verify(origin))return;
   item.progress=null;phase(index?'reconnecting':'uploading');item.uploadAttempted=true;
   const response=await request(origin+objectPath,{method:'POST',headers:{...headers,'Content-Type':'image/jpeg','x-upsert':'false'},body:item.blob,signal,timeout:45000,onProgress:(loaded,total)=>{const percent=Math.min(100,Math.floor(loaded/total*100));if(percent!==item.progress){item.progress=percent;progress();}}});checkSignal(signal);
   if(accepted(response)&&response.data?.Key===bucket+'/'+item.path)return;
   if(accepted(response)||duplicate(response)){if(await verify(origin))return;throw photoFailure('photo_unconfirmed');}
   throw statusError(response);
  }catch(error){
   checkSignal(signal);lastError=error;
   // Never replay authorization, invalid input or mismatched-object failures.
   if(!['photo_network','photo_timeout','photo_unconfirmed'].includes(error.code))throw error;
  }
 }
 throw lastError;
}
export function photoDiagnostic(batch){
 return ['照片上传排查 · 20261119-photo-1',...batch.items.filter(x=>x.status!=='success').map((x,i)=>'照片 '+(i+1)+'：步骤 '+(x.failedPhase||x.status)+'；代码 '+(x.errorCode||'photo_unknown')+'；入口 '+(x.connection||'未连接')),'不包含照片、姓名、账号或登录凭据。'].join('\n');
}
