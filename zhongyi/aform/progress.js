import {esc,today,addDays,validDate,validStage,stageDays,stageRecord,stageSchedule,stageDateInfo,extensionReady,nextFollow,cloneRecordData,caseStageActivity,firstPlanDates,schedulingActualDate} from './core.js?v=20261126-paper-entry-1';
import {requestUUID} from './self/core.js?v=20261118-progress-2';
export const stateLabel=s=>({active:'按约跟进',not_started:'尚未开始',paused:'暂停使用'}[s]||'按约跟进');
const date=s=>esc((s||'').replaceAll('-','.'));
const canSetStart=(c,observations)=>!observations.some(o=>o.case_id===c.id&&o.status==='submitted'&&o.stage!=='d1'&&validStage(o.stage));
export function stageButtons(c,observations,responses,active,photos=[]){
 return caseStageActivity(c,observations,photos).stages.map(({day,stage,status,photoCount})=>{
  const d=stageDateInfo(c,day,observations,responses);
  const state=(status==='submitted'?'已提交':status==='draft'?'草稿待提交':'')+(photoCount?(status?' · ':'')+'照片 '+photoCount+' 张':'');
  return '<button class="stage-button '+(active===stage?'active ':'')+(d.completed?'done':status==='draft'?'draft':'')+'" data-stage="'+stage+'"'+(!status&&!photoCount&&!d.actual?' data-empty-stage':'')+(active===stage?' aria-current="step"':'')+'><strong>'+(day===1?'首次观察':'第'+day+'天')+'</strong><small>'+(d.actual?'实际 ':'约定 ')+date((d.actual||d.planned).slice(5))+'</small>'+(state?'<span class="stage-save-state">'+state+'</span>':'')+(d.actual&&d.actual!==d.original?'<em>原计划 '+date(d.original.slice(5))+'</em>':'')+'</button>';
 }).join('');
}
export function stageRail(c,observations,responses,active,photos=[],{collapsed=false}={}){
 const buttons=stageButtons(c,observations,responses,active,photos);
 return (buttons.includes('data-empty-stage')?'<div class="stage-view-actions"><button type="button" class="text-btn" data-toggle-empty-stages aria-controls="case-stage-rail" aria-expanded="'+(!collapsed)+'">'+(collapsed?'展开待填写节点':'收起未填节点')+'</button></div>':'')+
  '<div id="case-stage-rail" data-collapse-empty="'+collapsed+'" class="stage-rail case-stage-rail" aria-label="回访节点，可左右滑动">'+buttons+'</div><details class="stage-explanation"><summary>日期随实际回访调整 <span>查看规则</span></summary><p class="small muted">按实际回访日期自动调整后续安排；补填旧记录按实际日期计算。节点不代表连续使用天数。</p></details>';
}
export function syncSuggestion(c,observations){
 const next=nextFollow(c,observations);if(!next||next.continuing)return null;
 const previous=stageDays(c,observations).filter(n=>n<next.day&&schedulingActualDate(stageRecord(c,observations,n))).at(-1);if(!previous||(previous===1&&firstPlanDates(c,'d1')))return null;
 const expected=addDays(schedulingActualDate(stageRecord(c,observations,previous)),next.day-previous);
 return expected===next.date?null:{day:next.day,date:expected};
}
export function progressPanel(c,observations,{owner=false}={}){
 const days=stageDays(c,observations),ready=extensionReady(c,observations),next=nextFollow(c,observations),state=c.progress?.state||'active',history=c.progress?.history||[];
 const start=firstPlanDates(c,'d1');
 const startInfo=start?'<p>实际开始 <strong>'+date(start.startDate)+'</strong> · 第 1–7 天 '+date(start.startDate)+' — '+date(start.endDate)+'</p>':'';
 const startButton=canSetStart(c,observations)?'<button class="btn tiny" data-action="service-start">'+(start?'修改实际开始日':'设置实际开始日')+'</button>':'';
 return '<section class="service-progress"><div><strong>服务进度 · '+stateLabel(state)+'</strong>'+startInfo+'<p>'+(next?(state==='active'?'下次回访':'下次联系')+' '+date(next.date)+(next.date<today()?' · 已到约定日期':''):'当前阶段已完成')+'</p></div>'+(owner?'<div class="service-progress-actions">'+startButton+(days.some(n=>!stageRecord(c,observations,n))?'<button class="btn secondary tiny" data-action="service-reschedule">调整回访日期</button>':'')+(syncSuggestion(c,observations)?'<button class="btn secondary tiny" data-action="service-sync">按最近回访同步日期</button>':'')+(ready?'<button class="btn tiny" data-action="service-extend">继续服务7天 · 新增第'+(days.at(-1)+7)+'天</button>':'')+'</div>':'')+(history.length?'<details><summary>查看 '+history.length+' 次进度调整</summary>'+history.slice().reverse().map(h=>'<p class="small">'+date(String(h.at||'').slice(0,10))+' · '+(h.action==='start'?'确认实际开始':h.action==='rollback'?'撤回后续误填':h.action==='restore_rollback'?'恢复撤回内容':(h.action==='extend'?'新增':h.action==='actual'?'实际回访':'调整')+'第'+esc(String(h.stage).slice(1))+'天')+' · '+date(h.date)+' · '+stateLabel(h.state)+(h.shift?' · 后续未完成节点一并调整':'')+(h.note?'<br>'+esc(h.note):'')+'</p>').join('')+'</details>':'')+'</section>';
}
export function progressError(e){const m=String(e?.message||'');return m.includes('service_conflict')?'服务进度刚刚有更新，请刷新档案后重试。':m.includes('service_start_after_followup')?'这份档案已有完成的后续回访。请在「调整回访日期」里安排下一次回访。':m.includes('service_invalid_start_date')?'实际开始日须为今天或更早。':m.includes('service_complete_current_first')?'请先完成当前最后一个回访节点，再增加下一周。':m.includes('service_completed_immutable')?'这个节点已经完成，请调整下一个未完成节点。':m.includes('service_invalid_date')?'日期不能早于建档或上一次已完成的回访。':m.includes('service_not_allowed')?'只有负责这份档案的上医可以调整进度。':'暂未确认保存结果。请重试；重复点击不会重复增加节点。';}
export function openActualStart(c,{dialog,save,onSaved}){
 const currentDay=today(), start=firstPlanDates(c,'d1')?.startDate||currentDay;
 const requestId=requestUUID(), version=c.progress?.version||0;
 dialog('<h2>设置实际开始日</h2><p>实际开始日算第 1 天。待回访节点和第一套产品方案会按这一天重新排期。</p>'+
  '<form id="actual-start-form"><div class="field"><label class="label" for="actual-start-date">实际开始日</label>'+
  '<input class="input" type="date" id="actual-start-date" name="date" value="'+esc(start)+'" max="'+currentDay+'" required></div>'+
  '<div class="small muted" id="actual-start-preview" aria-live="polite"></div><p role="alert"></p>'+
  '<div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-dialog">返回</button>'+
  '<button class="btn" type="submit">保存实际开始日</button></div></form>');
 const form=document.querySelector('#actual-start-form'), input=form.elements.date;
 const preview=form.querySelector('#actual-start-preview'), button=form.querySelector('[type=submit]');
 const update=()=>{
  const value=input.value;
  preview.textContent=input.validity.valid&&validDate(value)?
   '第一套方案 '+date(value)+' — '+date(addDays(value,6))+'。第 3 天回访 '+date(addDays(value,2))+'。第 7 天回访 '+date(addDays(value,6))+'。':'';
 };
 input.addEventListener('input',update);
 update();
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  e.stopPropagation();
  if(button.disabled||!form.reportValidity())return;
  const payload={p_case_id:c.id,p_action:'start',p_stage:'d1',p_date:input.value,p_state:'active',
   p_shift:true,p_note:'',p_expected_version:version,p_request_id:requestId};
  button.disabled=true;
  const error=form.querySelector('[role=alert]');
  error.textContent='';
  try{await onSaved(await save(payload),payload);}
  catch(err){error.textContent=progressError(err);button.disabled=false;}
 });
}
export function openProgress(c,observations,action,{dialog,save,onSaved,suggestedDate=null}){
 const days=stageDays(c,observations),extend=action==='extend',pending=days.filter(n=>!stageRecord(c,observations,n)),last=days.at(-1),target=extend?last+7:(nextFollow(c,observations)?.day||pending[0]),schedule=stageSchedule(c,observations);
 if(!target)return;
 const defaultDate=suggestedDate||(extend?addDays(stageRecord(c,observations,last).actual_date,7):schedule['d'+target]),requestId=requestUUID(),version=c.progress?.version||0;
 dialog('<h2>'+(extend?'再陪伴一周':'调整回访日期')+'</h2><p>'+(extend?'将在原档案中新增第'+target+'天回访，保留此前全部记录。完成后仍可继续增加7天。':'修改下一次回访或联系的约定日期。')+'</p><form id="service-progress-form"><div class="field"><label class="label" for="service-stage">回访节点</label><select class="input" id="service-stage" name="stage">'+(extend?[target]:[target,...pending.filter(n=>n!==target)]).map(n=>'<option value="d'+n+'">第'+n+'天节点</option>').join('')+'</select></div><div class="field"><label class="label" for="service-date">'+(extend?'下一次回访日期':'新的回访 / 联系日期')+'</label><input class="input" type="date" id="service-date" name="date" value="'+defaultDate+'" min="'+(extend?addDays(stageRecord(c,observations,last).actual_date,1):c.created_on)+'" required></div><div class="field"><label class="label" for="service-state">实际执行状态</label><select class="input" id="service-state" name="state">'+['active','not_started','paused'].map(s=>'<option value="'+s+'"'+((extend?'active':c.progress?.state||'active')===s?' selected':'')+'>'+stateLabel(s)+'</option>').join('')+'</select></div>'+(!extend?'<label class="service-shift"><input type="checkbox" name="shift" checked> 后续未完成节点按相同天数一起调整</label>':'')+'<p class="small muted" id="service-preview"></p><div class="field"><label class="label" for="service-note">调整说明（选填）</label><textarea class="input" id="service-note" name="note" rows="2" maxlength="500" placeholder="例如：本周未使用，改到下一周；按约保持联系。"></textarea></div><p class="small muted">暂停使用期间仍按约定联系日提醒，不会自动记成已使用。</p><p id="service-error" role="alert"></p><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-dialog">返回</button><button type="submit" class="btn">'+(extend?'确认增加7天':'保存调整')+'</button></div></form>');
 const form=document.querySelector('#service-progress-form'),preview=form.querySelector('#service-preview');
 const update=()=>{const f=new FormData(form),n=Number(String(f.get('stage')).slice(1)),d=f.get('date');if(!validDate(d)){preview.textContent='';return;}const shift=Math.round((Date.parse(d)-Date.parse(schedule['d'+n]||d))/86400000);preview.textContent=(extend?'新增节点：':'调整后：')+(extend?[n]:pending.filter(x=>x===n||(f.has('shift')&&x>n))).map(x=>'第'+x+'天 '+(x===n?d:addDays(schedule['d'+x],shift)).replaceAll('-','.')).join('；');};
 form.querySelector('[name=stage]').onchange=()=>{form.elements.date.value=schedule[form.elements.stage.value];update();};form.addEventListener('input',update);update();
 form.addEventListener('submit',async e=>{e.preventDefault();e.stopPropagation();const b=form.querySelector('[type=submit]');if(b.disabled)return;const f=new FormData(form),payload={p_case_id:c.id,p_action:action,p_stage:f.get('stage'),p_date:f.get('date'),p_state:f.get('state'),p_shift:!extend&&f.has('shift'),p_note:String(f.get('note')||''),p_expected_version:version,p_request_id:requestId};b.disabled=true;form.querySelector('#service-error').textContent='';try{const result=await save(payload);await onSaved(result,payload);}catch(err){form.querySelector('#service-error').textContent=progressError(err);b.disabled=false;}});
}
export function demoProgress(c,observations,p){
 const progress=cloneRecordData(c.progress||{case_id:c.id,last_day:21,dates:{},history:[],version:0,state:'active'}),before=stageSchedule(c,observations),n=Number(p.p_stage.slice(1)),stamp=new Date().toISOString();
 if(p.p_action==='start'){
  if(!canSetStart(c,observations))throw Error('service_start_after_followup');
  if(!validDate(p.p_date)||p.p_date>today())throw Error('service_invalid_start_date');
  progress.actual_started_on=p.p_date;
  for(const day of stageDays(c,observations)){
   if(!stageRecord(c,observations,day))progress.dates['d'+day]={date:addDays(p.p_date,day-1),updated_at:stamp};
  }
 }else if(p.p_action==='extend'){if(!extensionReady(c,observations))throw Error('service_complete_current_first');progress.last_day=n;progress.dates[p.p_stage]={date:p.p_date,updated_at:stamp};}
 else{const delta=Math.round((Date.parse(p.p_date)-Date.parse(before[p.p_stage]))/86400000);for(const day of stageDays(c,observations))if(day>=n&&!stageRecord(c,observations,day))progress.dates['d'+day]={date:addDays(before['d'+day],day===n||p.p_shift?delta:0),updated_at:stamp};}
 progress.state=p.p_state;progress.version++;progress.updated_at=stamp;progress.history.push({action:p.p_action,stage:p.p_stage,date:p.p_date,shift:p.p_shift,state:p.p_state,note:p.p_note,at:stamp,before});return progress;
}
