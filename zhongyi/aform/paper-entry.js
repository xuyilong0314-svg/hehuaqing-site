import {esc,today,addDays,validDate,keepsFollowupSchedule,preserveFollowupSchedule} from './core.js?v=20261126-paper-entry-1';

export function paperEntryFields(data={}){
 const paper=data.entrySource==='paper';
 const sync=paper&&data.schedulePolicy==='adjust';
 return '<div class="observation-entry-source"><label for="entry-source">录入方式</label>'+
  '<select class="input" id="entry-source" name="entrySource"><option value="online">电子录入</option>'+
  '<option value="paper"'+(paper?' selected':'')+'>纸质补录</option></select>'+
  '<div data-paper-entry-fields'+(paper?'':' hidden')+'>'+
  '<label class="field" for="paper-next-date">纸上约定的下次日期（选填）<input class="input" id="paper-next-date" type="date" name="paperNextDate" value="'+esc(data.paperNextDate||'')+'"'+(paper?'':' disabled')+'></label>'+
  '<label class="service-shift"><input type="checkbox" name="paper_sync_followup"'+(sync?' checked':'')+(paper?'':' disabled')+'> 同步调整后续回访</label>'+
  '<p class="small muted" data-paper-followup-note>'+paperFollowupNote(sync)+'</p></div></div>';
}

function paperFollowupNote(sync){
 return sync?'按本次实际回访日期安排后续节点。填写新的下次约定时，按所填日期排期。':'按纸上实际日期补录，保留现有回访安排。';
}

export function syncPaperEntry(form,{sourceChanged=false}={}){
 const paper=form.elements.entrySource.value==='paper';
 const sync=form.elements.paper_sync_followup.checked;
 const keep=paper&&!sync;
 const actual=form.elements.actual_date;
 form.querySelector('[data-paper-entry-fields]').hidden=!paper;
 form.elements.paper_sync_followup.disabled=!paper;
 form.elements.paperNextDate.disabled=!paper;
 form.querySelector('[data-paper-followup-note]').textContent=paperFollowupNote(sync);
 form.querySelectorAll('[data-active-followup]').forEach(element=>{element.hidden=keep;});
 form.elements.nextDate.disabled=keep;
 const summary=form.querySelector('[data-followup-summary]');
 if(summary)summary.textContent=keep?'本次补录保留现有回访安排。':'后续未完成节点按实际回访日期或所填下次约定调整。';
 if(sourceChanged&&!form.dataset.id&&actual.dataset.dateTouched!=='true'){
  if(paper&&actual.value===today())actual.value='';
  if(!paper&&!actual.value)actual.value=today();
 }
}

export function captureEntry(data,fields,existing){
 if(!fields.has('entrySource'))return data;
 const paper=fields.get('entrySource')==='paper';
 const {scheduleAnchor,...saved}=data;
 if(!paper){
  delete saved.schedulePolicy;
  return {...saved,entrySource:'online'};
 }
 const adjusted=fields.has('paper_sync_followup');
 const paperNextDate=String(fields.get('paperNextDate')||'');
 if(paperNextDate&&!validDate(paperNextDate))throw Error('请填写有效的纸上约定日期。');
 const entry={...saved,entrySource:'paper',schedulePolicy:adjusted?'adjust':'keep',paperNextDate,
   paperNextService:String(fields.get('nextService')||'')};
 return keepsFollowupSchedule(entry)?preserveFollowupSchedule(entry,existing):entry;
}

export function updatePlanDateControls(form){
 const toggle=form.elements.plan_custom_dates;
 if(!toggle)return;
 const manual=toggle.checked;
 const start=form.elements.plan_startDate,end=form.elements.plan_endDate;
 start.readOnly=end.readOnly=!manual;
 if(!manual){
  toggle.dataset.manualStart=start.value;
  toggle.dataset.manualEnd=end.value;
  start.value=toggle.dataset.start;
  end.value=toggle.dataset.end;
 }else if(toggle.dataset.manualStart!==undefined){
  start.value=toggle.dataset.manualStart;
  end.value=toggle.dataset.manualEnd;
 }
 form.querySelector('[data-recalculate-plan-dates]').hidden=!manual;
}

export function recalculatePlanDates(form){
 const actual=form.elements.actual_date;
 if(!validDate(actual.value)){actual.reportValidity();actual.focus();return;}
 const start=form.elements.plan_startDate,end=form.elements.plan_endDate;
 if(start.readOnly||end.readOnly)return;
 const first=form.querySelector('[data-recalculate-plan-dates]').dataset.first==='true';
 start.value=addDays(actual.value,first?0:1);
 end.value=addDays(actual.value,first?6:7);
 start.dataset.dateTouched=end.dataset.dateTouched='true';
}
