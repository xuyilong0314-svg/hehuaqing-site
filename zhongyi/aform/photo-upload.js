import {loadingMarkup} from '../../account/loading.js?v=20261119-ux-1';
import {loadingBlessing} from '../../account/loading-themes.js?v=20261118-loading-2';
import {esc} from './core.js?v=20261121-save-compat-1';
import {requestUUID} from './self/core.js?v=20261118-progress-2';

// Tasks live only in this page's memory; never persist private images in browser storage.
export function createPhotoTasks(files,{id=requestUUID,preview=file=>URL.createObjectURL(file)}={}){
 return files.map(file=>({id:id(),file,preview:preview(file),status:'queued',error:'',blob:null,storageUploaded:false}));
}
export function uploadCounts(items){return {total:items.length,saved:items.filter(i=>i.status==='success').length,failed:items.filter(i=>i.status==='error').length,pending:items.filter(i=>i.status!=='success').length};}
export async function runPhotoBatch({items,prepare,persist,signal,onChange=()=>{},message=e=>e?.message||String(e)}){
 for(const item of items){
  if(signal?.aborted)break;
  if(item.status==='success')continue;
  item.error='';item.errorCode='';item.failedPhase='';item.errorHttp=0;item.errorAt='';
  const phase=status=>{item.status=status;onChange(item);};
  try{
   if(!item.blob){phase('preparing');item.blob=await prepare(item.file);}
   if(signal?.aborted)break;phase('uploading');
   item.saved=await persist(item,phase);if(signal?.aborted)break;
   // Only both storage and record persistence completing may produce success.
   phase('success');
  }catch(error){
   item.failedPhase=item.status;
   item.errorCode=error?.code||error?.name||'photo_unknown';
   item.errorHttp=Number(error?.httpStatus||error?.status)||0;
   item.errorAt=new Date().toISOString();
   item.error=message(error,item);
   phase('error');
   if(signal?.aborted||item.errorCode==='photo_rate_limited')break;
  }
 }
 return uploadCounts(items);
}
export function renderUploadFeedback(batch,{demo=false}={}){
 if(!batch)return '';
 const counts=uploadCounts(batch.items),running=batch.running,complete=counts.total>0&&!counts.pending&&!batch.error;
 const active=batch.items.find(i=>['preparing','connecting','checking','reconnecting','retrying','uploading','confirming'].includes(i.status));
 const labels={queued:'等待上传',preparing:'正在处理照片',connecting:'正在连接照片服务',checking:'正在核对上次上传结果',reconnecting:'正在换用另一上传入口',retrying:'稍候，正在重新连接',uploading:demo?'正在添加照片':'正在上传照片',confirming:demo?'正在保存体验记录':'正在确认云端保存',success:demo?'已添加到体验页面':'已上传并保存',error:'尚未成功'};
 const headline=running?(batch.phase==='saving'?'正在保存本次记录':active?labels[active.status]:'正在准备照片'):complete?(demo?'照片已添加（体验）':'照片上传成功'):counts.saved?'部分照片已保存':'照片尚未上传成功';
 const helper=running?(batch.slow?'网络较慢，请保持本页打开；请勿重复选择照片。':'请保持本页打开，完成后会显示绿色对勾。'):complete?(demo?'仅保留在当前体验页面，未上传云端。':'已私密保存 '+counts.saved+' 张，可继续填写或查看对照。'):'成功的照片无需重传；未成功的照片保留在本页，刷新或关闭会丢失。';
 const sent=active&&Number.isFinite(active.progress)&&['uploading','reconnecting'].includes(active.status)?'<p class="upload-transfer-progress" role="status">照片已传输 '+active.progress+'%'+(active.progress===100?' · 等待云端接收确认':'')+'</p>':'';
 const pending=batch.items.filter(i=>i.status!=='success');
 if(running&&!batch.loadingBlessing)batch.loadingBlessing=loadingBlessing('save');
 const actions=!running&&counts.pending?'<div class="upload-result-actions"><button type="button" class="btn secondary full" data-action="retry-photos">重试未成功照片</button><button type="button" class="text-btn full" data-action="copy-photo-diagnostic">复制排查信息</button></div>':'';
 const loading=running?'<div class="hhq-loading-inline">'+loadingMarkup(headline,helper,{theme:'save',blessing:batch.loadingBlessing,note:'已保存 '+counts.saved+' / '+counts.total+' 张；完成后可继续填写。'})+'</div>':'';
 return '<section class="upload-result '+(running?'is-running':complete?'is-success':'is-error')+'" aria-label="照片上传状态">'+loading+'<div class="upload-result-head"><span class="'+(running?'upload-spinner':complete?'upload-check':'upload-attention')+'" aria-hidden="true">'+(running?'':complete?'✓':'!')+'</span><div><strong>'+esc(headline)+'</strong><p>'+esc(helper)+'</p></div></div><div class="upload-count" role="status" aria-live="polite" aria-atomic="true">'+esc(headline)+' · '+(demo?'已添加':'已保存')+' '+counts.saved+' / '+counts.total+' 张</div>'+actions+sent+(running?'<div class="upload-motion" aria-hidden="true"><span></span></div>':'')+(batch.error?'<p class="upload-error-text" role="alert">'+esc(batch.error)+'</p>':'')+(pending.length?'<ul class="upload-tasks">'+pending.map(item=>'<li><img src="'+esc(item.preview)+'" alt="待上传照片预览"><div><strong>'+esc(item.file.name)+'</strong><span>'+esc(labels[item.status]||'等待上传')+'</span>'+(item.error?'<p>'+esc(item.error)+'</p>':'')+'</div>'+(!running?'<button type="button" class="text-btn" data-remove-upload="'+esc(item.id)+'" aria-label="移出待传列表：'+esc(item.file.name)+'">移出</button>':'')+'</li>').join('')+'</ul>':'')+'</section>';
}
