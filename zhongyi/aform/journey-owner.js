import {withLoading,beginLoading} from '../../account/loading.js?v=20261119-ux-1';
import {esc,dateText,stageHTML,healthRecordTitle} from './journey/core.js?v=20261121-record-title';
export const journeyEntry=c=>'<button type="button" class="btn secondary tiny" data-journey-case="'+esc(c.id)+'">记录分享 ↗</button>';
export function openJourneyOwner(c,context){return withLoading({theme:'journey',title:'正在整理服务历程'},()=>openJourneyContent(c,context));}
async function openJourneyContent(c,{db,demo,dialog,notify}){
 if(demo){dialog('<h2>一份有温度的记录</h2><p>客户打开自己的记录页后，可以选择内容、预览，再点击分享。</p><p class="small muted">此处为虚构示例，不包含客户资料。</p><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">关闭</button><a class="btn" href="./journey/#demo" target="_blank" rel="noopener noreferrer">看看示例 ↗</a></div>');return;}
 const title=healthRecordTitle(c.name);
 const result=await db.rpc('preview_record_journey',{p_case_id:c.id});if(result.error)throw result.error;const state=result.data;
 if(state?.status!=='ready')throw Error('暂时无法打开这份记录。');
 const photoUrls=new Map();if(state.photo_candidates.length){const r=await db.storage.from('case-photos').createSignedUrls(state.photo_candidates.map(p=>p.storage_path),120);if(!r.error)for(const p of r.data||[])if(p.signedUrl)photoUrls.set(p.path,p.signedUrl);}
 const url=t=>new URL('./journey/#m='+t,location.href).href;
 dialog('<div class="journey-owner"><div class="eyebrow">把记录，还给认真生活的本人</div><h2>'+esc(title)+'</h2><p>让本人回看，也能自己分享。</p><p class="small muted">本人入口可以查看和管理分享，请只发给本人。客户想分享给朋友时，会在页面里生成另一条只读链接。</p><details class="journey-owner-preview"><summary>预览将交给本人的文字与评分</summary>'+state.content.stages.filter(s=>s.recorded).map(stageHTML).join('')+(!state.content.stages.some(s=>s.recorded)?'<p>目前还没有完成的记录。后续记录完成后，回来更新这份页面。</p>':'')+'</details>'+(state.photo_candidates.length?'<fieldset class="journey-owner-photos"><legend>交给本人回看的照片（选填，最多10张）</legend>'+state.photo_candidates.map(p=>'<label>'+(photoUrls.has(p.storage_path)?'<img src="'+esc(photoUrls.get(p.storage_path))+'" alt="第'+p.stage.slice(1)+'天待选照片" loading="lazy">':'<span class="small">照片预览暂未载入，请重新打开后再选择。</span>')+'<span><input type="checkbox" name="journey-photo" value="'+esc(p.id)+'" '+(!photoUrls.has(p.storage_path)?'disabled':'')+'>第 '+p.stage.slice(1)+' 天 · '+dateText(p.taken_on)+'</span></label>').join('')+'<p class="small muted">保留原照片另存预览图。本人再次分享时，还要单独勾选照片。</p></fieldset>':'')+'<label class="journey-owner-consent"><input type="checkbox" id="journey-owner-consent"><span>我已向本人说明并征得同意，将以上记录交给本人查看；本人入口只发给本人。</span></label><p class="small muted">页面保留确认时的记录。新增内容后，请回到这里更新；客户已发给朋友的分享页由客户自己决定是否更新。</p><p id="journey-owner-error" class="small" role="alert"></p><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">关闭</button><button class="btn" id="publish-journey">'+(state.manage_token?'确认并更新本人记录页':'确认并开启本人记录页')+'</button></div>'+(state.manage_token?'<div class="journey-existing"><a class="text-btn" href="'+esc(url(state.manage_token))+'" target="_blank" rel="noopener noreferrer">打开现有本人记录页 ↗</a><button class="text-btn" id="close-journey">关闭本人入口及全部分享</button></div>':'')+'</div>');
 let pending=false;const modal=document.querySelector('#dialog'),cancelSaving=e=>{if(pending)e.preventDefault();};modal.addEventListener('cancel',cancelSaving);modal.addEventListener('close',()=>modal.removeEventListener('cancel',cancelSaving),{once:true});
 document.querySelector('#publish-journey').addEventListener('click',async event=>{
  if(pending)return;const error=document.querySelector('#journey-owner-error');error.textContent='';
  if(!document.querySelector('#journey-owner-consent').checked){error.textContent='请先确认已经征得本人同意。';return;}
  const ids=[...document.querySelectorAll('[name="journey-photo"]:checked')].map(x=>x.value);if(ids.length>10){error.textContent='一次最多选择10张照片。';return;}
  const button=event.currentTarget,loading=beginLoading({theme:'journey',title:'正在准备本人记录页'});pending=true;modal.querySelectorAll('button,input,a').forEach(el=>{if(el.tagName!=='A')el.disabled=true;});button.textContent='正在准备本人记录页…';
  try{const previews=[];for(const id of ids){const photo=state.photo_candidates.find(p=>p.id===id);button.textContent='正在准备照片 '+(previews.length+1)+' / '+ids.length;loading.update(button.textContent);const r=await db.storage.from('case-photos').download(photo.storage_path);if(r.error)throw r.error;previews.push({id,image:await thumbnail(r.data)});}
   button.textContent='正在保存记录页…';loading.update('正在保存记录页');const r=await db.rpc('publish_record_journey',{p_case_id:c.id,p_photo_previews:previews,p_confirm:true});if(r.error)throw r.error;
   const target=url(r.data.token),text=title+'\n\n给你留了一份这段时间的记录。\n有空时，慢慢看看自己的感受。页面里的“分享我的记录”，可以挑选内容分享给你信任的人。\n这是你的本人管理入口，请自己保管：\n'+target;
   dialog('<h2>'+esc(title)+'</h2><p class="small muted">本人入口有效至 '+dateText(r.data.expires_at.slice(0,10))+'。请只发给本人；分享给朋友请在记录页内点“分享我的记录”。</p><textarea id="journey-owner-copy" class="input" rows="7" readonly>'+esc(text)+'</textarea><p id="journey-owner-copy-status" class="small" role="status"></p><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">关闭</button><a class="btn secondary" href="'+esc(target)+'" target="_blank" rel="noopener noreferrer">打开记录页 ↗</a><button class="btn" id="copy-journey">复制本人入口与说明</button></div>');
   document.querySelector('#copy-journey').addEventListener('click',async()=>{const area=document.querySelector('#journey-owner-copy');try{await navigator.clipboard.writeText(area.value);document.querySelector('#journey-owner-copy-status').textContent='已复制，请发给本人。';}catch{area.focus();area.select();document.querySelector('#journey-owner-copy-status').textContent='请长按以上文字复制。';}});
  }catch(e){error.textContent='这次没有完成，请稍后重试。原有记录保持不变。';modal.querySelectorAll('button,input').forEach(el=>el.disabled=false);button.textContent='重试准备记录页';}finally{loading.finish();pending=false;}
 });
 document.querySelector('#close-journey')?.addEventListener('click',async event=>{if(pending)return;if(!confirm('关闭后，本人入口和已经发出的分享链接都将失效。原档案保留。确定关闭吗？'))return;pending=true;event.currentTarget.disabled=true;try{const r=await withLoading({theme:'journey',title:'正在关闭记录入口'},()=>db.rpc('close_record_journey',{p_case_id:c.id}));if(r.error)throw r.error;document.querySelector('#dialog').close();notify('本人入口与分享已关闭，原档案仍保留。');}catch{document.querySelector('#journey-owner-error').textContent='暂时没有完成关闭，请稍后重试。';event.currentTarget.disabled=false;}finally{loading.finish();pending=false;}});
}
async function thumbnail(blob){
 const src=URL.createObjectURL(blob);
 try{
  const img=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  // Ten previews and their JSON wrapper stay below the existing 1 MiB account gateway.
  for(const edge of [600,500,400,320]){
   const ratio=Math.min(1,edge/Math.max(img.naturalWidth,img.naturalHeight));
   canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   for(const quality of [.72,.6,.48]){const result=canvas.toDataURL('image/jpeg',quality);if(result.startsWith('data:image/jpeg;base64,/9j/')&&result.length<=85000)return result;}
  }
  throw Error('照片暂时无法准备，请换一张或稍后再试。');
 }finally{URL.revokeObjectURL(src);}
}
