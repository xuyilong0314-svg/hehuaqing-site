import {esc} from './core.js';

// Tasks live only in this page's memory; never persist private images in browser storage.
export function createPhotoTasks(files,{id=()=>crypto.randomUUID(),preview=file=>URL.createObjectURL(file)}={}){
 return files.map(file=>({id:id(),file,preview:preview(file),status:'queued',error:'',blob:null,storageUploaded:false}));
}
export function uploadCounts(items){return {total:items.length,saved:items.filter(i=>i.status==='success').length,failed:items.filter(i=>i.status==='error').length,pending:items.filter(i=>i.status!=='success').length};}
export async function runPhotoBatch({items,prepare,persist,onChange=()=>{},message=e=>e?.message||String(e)}){
 for(const item of items){
  if(item.status==='success')continue;
  item.error='';
  const phase=status=>{item.status=status;onChange(item);};
  try{
   if(!item.blob){phase('preparing');item.blob=await prepare(item.file);}
   phase('uploading');
   item.saved=await persist(item,phase);
   // Only both storage and record persistence completing may produce success.
   phase('success');
  }catch(error){item.error=message(error);phase('error');}
 }
 return uploadCounts(items);
}
export async function uploadDeadline(promise,ms=45000){
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('连接较慢，尚未确认保存。照片仍保留在本页，请检查网络后重试。')),ms);})]);}
 finally{clearTimeout(timer);}
}
export function renderUploadFeedback(batch,{demo=false}={}){
 if(!batch)return '';
 const counts=uploadCounts(batch.items),running=batch.running,complete=counts.total>0&&!counts.pending&&!batch.error;
 const active=batch.items.find(i=>['preparing','uploading','confirming'].includes(i.status));
 const labels={queued:'等待上传',preparing:'正在处理照片',uploading:demo?'正在添加照片':'正在上传照片',confirming:demo?'正在保存体验记录':'正在确认云端保存',success:demo?'已添加到体验页面':'已上传并保存',error:'尚未成功'};
 const headline=running?(batch.phase==='saving'?'正在保存本次记录':active?labels[active.status]:'正在准备照片'):complete?(demo?'照片已添加（体验）':'照片上传成功'):counts.saved?'部分照片已保存':'照片尚未上传成功';
 const helper=running?(batch.slow?'网络较慢，请保持本页打开；请勿重复选择照片。':'请保持本页打开，完成后会显示绿色对勾。'):complete?(demo?'仅保留在当前体验页面，未上传云端。':'已私密保存 '+counts.saved+' 张，可继续填写或查看对照。'):'成功的照片无需重传；未成功的照片保留在本页，刷新或关闭会丢失。';
 const pending=batch.items.filter(i=>i.status!=='success');
 return '<section class="upload-result '+(running?'is-running':complete?'is-success':'is-error')+'" aria-label="照片上传状态"><div class="upload-result-head"><span class="'+(running?'upload-spinner':complete?'upload-check':'upload-attention')+'" aria-hidden="true">'+(running?'':complete?'✓':'!')+'</span><div><strong>'+esc(headline)+'</strong><p>'+esc(helper)+'</p></div></div><div class="upload-count" role="status" aria-live="polite" aria-atomic="true">'+esc(headline)+' · '+(demo?'已添加':'已保存')+' '+counts.saved+' / '+counts.total+' 张</div>'+(running?'<div class="upload-motion" aria-hidden="true"><span></span></div>':'')+(batch.error?'<p class="upload-error-text" role="alert">'+esc(batch.error)+'</p>':'')+(pending.length?'<ul class="upload-tasks">'+pending.map(item=>'<li><img src="'+esc(item.preview)+'" alt="待上传照片预览"><div><strong>'+esc(item.file.name)+'</strong><span>'+esc(labels[item.status]||'等待上传')+'</span>'+(item.error?'<p>'+esc(item.error)+'</p>':'')+'</div>'+(!running?'<button type="button" class="text-btn" data-remove-upload="'+esc(item.id)+'" aria-label="移出待传列表：'+esc(item.file.name)+'">移出</button>':'')+'</li>').join('')+'</ul>':'')+(!running&&counts.pending?'<button type="button" class="btn secondary full" data-action="retry-photos">重试未成功照片</button>':'')+'</section>';
}
