export const STAGES = [1,3,7,14,21];
export const ITEMS = [['spirit','精神'],['sleep','睡眠'],['appetite','食欲'],['bowel','排便'],['mood','情绪']];
export const PRODUCTS=['人参双茅饮','人参葛根饮','黄精枸杞饮','陈皮四季饮','康美铁玛','灵芝孢子油','睡眠兽'];
export const NEEDS=['日常养护，保持状态','近期劳累，希望恢复','有具体困扰，希望改善'];
export const FEELINGS=['精神不足','睡眠不稳','食欲变化','排便不畅','情绪波动','体力下降'];
export const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
export const today=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const addDays=(date,n)=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10);};
export const dayNumber=(date,now=today())=>Math.round((Date.parse(now+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000)+1;
export const stageName=s=>s==='extra'?'补充记录':s==='d1'?'首次观察':`第 ${s.slice(1)} 天`;
export const validStage=s=>/^d[1-9]\d{0,4}$/.test(s||'')&&(STAGES.includes(Number(s.slice(1)))||(Number(s.slice(1))>21&&Number(s.slice(1))<=36500&&Number(s.slice(1))%7===0));
export const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function stageDays(c,observations=[]){
 const last=Math.max(21,Number(c?.progress?.last_day)||21,...observations.filter(o=>o.case_id===c?.id&&validStage(o.stage)).map(o=>Number(o.stage.slice(1))));
 return [...STAGES,...Array.from({length:Math.max(0,Math.floor((Math.min(last,36500)-21)/7))},(_,i)=>28+i*7)];
}
export function caseStageActivity(c,observations=[],photos=[]){
 const statuses=new Map(),counts=new Map();
 for(const o of observations){
  if(o.case_id!==c.id||!o.id)continue;
  if(o.status==='submitted'||(o.status==='draft'&&!statuses.has(o.stage)))statuses.set(o.stage,o.status);
 }
 let photoCount=0;
 for(const photo of photos){
  if(photo.case_id!==c.id||!photo.id)continue;
  counts.set(photo.stage,(counts.get(photo.stage)||0)+1);
  photoCount++;
 }
 const stages=stageDays(c,observations).map(day=>{
  const stage='d'+day;
  return {day,stage,status:statuses.get(stage)||'',photoCount:counts.get(stage)||0};
 });
 return {stages,photoCount,submitted:stages.filter(item=>item.status==='submitted').length,drafts:stages.filter(item=>item.status==='draft').length};
}
export function caseActivityText({submitted,drafts,photoCount}){
 return [submitted?'已提交 '+submitted+' 次':'',drafts?'待提交草稿 '+drafts+' 份':'',photoCount?'照片已保存 '+photoCount+' 张':''].filter(Boolean).join(' · ')||'尚未保存观察';
}
export function stageRecord(c,observations,day){return observations.filter(o=>o.case_id===c.id&&o.stage==='d'+day&&o.status==='submitted').sort((a,b)=>String(b.updated_at||b.actual_date||'').localeCompare(String(a.updated_at||a.actual_date||'')))[0]||null;}
export function stageSchedule(c,observations=[]){
 const dates={},days=stageDays(c,observations);
 days.forEach((day,i)=>{
  const prior=i?stageRecord(c,observations,days[i-1]):null,override=c.progress?.dates?.['d'+day];
  const agreed=validDate(prior?.data?.nextDate)?prior.data.nextDate:null;
  const useAgreed=agreed&&(!override||String(prior.data.nextDateSetAt||'')>String(override.updated_at||''));
  dates['d'+day]=useAgreed?agreed:validDate(override?.date)?override.date:agreed|| (i?addDays(prior?.actual_date||dates['d'+days[i-1]],day-days[i-1]):c.created_on);
 });
 return dates;
}
export function stageDateInfo(c,day,observations=[],responses=[]){
 const own=responses.filter(r=>r.case_id===c.id&&r.stage==='d'+day).sort((a,b)=>String(b.submitted_at).localeCompare(String(a.submitted_at)))[0],record=stageRecord(c,observations,day);
 return {actual:own?.actual_date||record?.actual_date||'',source:own?'客户记录':record?'上医记录':'',planned:stageSchedule(c,observations)['d'+day],original:(day>21?c.progress?.history?.find(h=>h.action==='extend'&&h.stage==='d'+day)?.date:null)||addDays(c.created_on,day-1),completed:Boolean(record)};
}
export function nextFollow(c,observations=[]){
 const days=stageDays(c,observations),lastDone=Math.max(0,...days.filter(n=>stageRecord(c,observations,n))),pending=days.find(n=>n>lastDone&&!stageRecord(c,observations,n));
 if(pending)return {day:pending,date:stageSchedule(c,observations)['d'+pending],state:c.progress?.state||'active'};
 const final=stageRecord(c,observations,days.at(-1));
 return validDate(final?.data?.nextDate)&&final.data.nextService!=='结束本阶段'?{day:days.at(-1),date:final.data.nextDate,continuing:true,state:c.progress?.state||'active'}:null;
}
export function extensionReady(c,observations=[]){return Boolean(stageRecord(c,observations,stageDays(c,observations).at(-1)));}

export function csv(rows){return '\ufeff'+rows.map(r=>r.map(v=>{let s=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');}
export const canTeach=c=>c.consent_teaching===true;
// Stored plans, observations and follow-up state use JSON data.
export function cloneRecordData(value){
 return typeof globalThis.structuredClone==='function' ? globalThis.structuredClone(value) : JSON.parse(JSON.stringify(value));
}
export function cleanImageType(file){if(/\.hei[cf]$/i.test(file.name)||/hei[cf]/i.test(file.type))throw Error('请先将 HEIC 照片转换为 JPG，再上传。');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('支持 JPG、PNG、WebP 图片。');if(file.size>10*1024*1024)throw Error('单张照片请小于 10MB。');return true;}
// Mirrors the server rule for the isolated demonstration and date-rule tests.
export function applyActualFollowup(c,observations,record,existing=null,stamp=new Date().toISOString()){
 if(record.status!=='submitted'||!validStage(record.stage))return {record,progress:c.progress};
 const day=Number(record.stage.slice(1)),days=stageDays(c,observations);
 if(observations.some(o=>o.case_id===c.id&&o.id!==record.id&&o.status==='submitted'&&validStage(o.stage)&&Number(o.stage.slice(1))>day))return {record,progress:c.progress};
 const before=stageSchedule(c,observations),next=days.find(n=>n>day),anchor=existing?.status==='submitted'?existing.actual_date:before[record.stage];
 let delta=Math.round((Date.parse(record.actual_date)-Date.parse(anchor))/86400000);
 const explicit=record.data?.nextDateSetAt&&record.data.nextDateSetAt!==existing?.data?.nextDateSetAt;
 if(explicit&&next&&validDate(record.data.nextDate))delta=Math.round((Date.parse(record.data.nextDate)-Date.parse(before['d'+next]))/86400000);
 if(!delta||!Number.isFinite(delta))return {record,progress:c.progress};
 const progress=cloneRecordData(c.progress||{case_id:c.id,last_day:21,state:'active',dates:{},history:[],version:0}),saved=cloneRecordData(record);
 for(const n of days)if(n>day&&!stageRecord(c,observations,n))progress.dates['d'+n]={date:addDays(before['d'+n],delta),updated_at:stamp};
 if(next)saved.data={...saved.data,nextDate:addDays(before['d'+next],delta),nextDateSetAt:stamp,nextDateSource:explicit?'agreed':'actual_followup'};
 else if(!explicit&&validDate(saved.data?.nextDate))saved.data={...saved.data,nextDate:addDays(saved.data.nextDate,delta),nextDateSetAt:stamp,nextDateSource:'actual_followup'};
 progress.version++;progress.updated_at=stamp;progress.history.push({action:'actual',stage:saved.stage,date:saved.actual_date,state:progress.state,shift:true,note:explicit?'按本次明确约定调整后续日期':'按实际回访日期调整后续未完成节点',at:stamp,before,days_changed:delta});
 return {record:saved,progress};
}
