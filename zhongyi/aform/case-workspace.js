import {STAGES,esc,stageName,stageDays,cloneRecordData,validStage,firstPlanDates} from './core.js?v=20261126-actual-start-1';
import {requestUUID} from './self/core.js?v=20261118-progress-2';
import {STAGE_FLOW,stageFlow,productElementLabel,productWithPlanTime} from './workflow.js?v=20261126-week-review-1';

export function personalCases(cases,userId,{kind='client'}={}){
  if(!userId)return [];
  return cases.filter(c=>!c.deleted_at&&c.owner_id===userId&&(!kind||c.kind===kind));
}
export function preferredStage(caseId,observations,{requested='',remembered='',caseRecord=null}={}){
  const valid=s=>stageDays(caseRecord||{id:caseId},observations).some(n=>'d'+n===s);
  if(valid(requested))return requested;
  if(valid(remembered)&&observations.some(o=>o.id&&o.case_id===caseId&&o.stage===remembered))return remembered;
  const saved=observations.filter(o=>o.case_id===caseId&&o.id&&valid(o.stage)).sort((a,b)=>
    String(b.updated_at||b.actual_date||b.created_at||'').localeCompare(String(a.updated_at||a.actual_date||a.created_at||''))||Number(b.stage.slice(1))-Number(a.stage.slice(1)));
  return saved[0]?.stage||'d1';
}
export function formFingerprint(form){
  // Disabled/readonly toggles during uploads do not change the underlying form data.
  const fields=[...form.elements].filter(e=>e.name&&!['file','submit','button','reset'].includes(e.type)&&(!['checkbox','radio'].includes(e.type)||e.checked))
    .flatMap(e=>e.tagName==='SELECT'&&e.multiple?[...e.selectedOptions].map(o=>[e.name,o.value]):[[e.name,e.value??'']]);
  // Product shortcuts can reorder controls while their saved row indices stay fixed.
  const productField=([name])=>name.startsWith('plan_product_');
  const plan=fields.filter(productField).sort(([a,x],[b,y])=>a.localeCompare(b)||(a==='plan_product_index'?Number(x)-Number(y):0));
  return JSON.stringify([...fields.filter(field=>!productField(field)),...plan]);
}
export function saveStateText({record,stage,dirty=false,photos=0,pending=0,demo=false}){
  const prefix=stageName(stage)+' · ';
  if(dirty)return prefix+'有修改待保存'+(photos?' · 已存照片 '+photos+' 张，无需重传':'');
  if(!record?.id)return prefix+'尚未填写 · 其他阶段的记录仍已保留';
  const saved=record.status==='submitted'?'本次观察已提交':'草稿已保存 · 待提交';
  return prefix+saved+(demo?'（体验）':'')+(photos?' · 照片 '+photos+' 张，无需重传':'')+(pending?' · '+pending+' 张待重试':'');
}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function comparablePlan(plan={}){
  // Derived element labels and empty paper-template fields are not an adjustment.
  const p=Object.fromEntries(['title','basis','decision','startDate','endDate','note'].map(key=>[key,plan[key]||'']));
  p.products=(plan.products||[]).filter(product=>hasPlan({products:[product]})).map(product=>{
    const normalized=productWithPlanTime(product);
    const row=Object.fromEntries(['name','time','amount','unit','perDay','note'].map(key=>[key,normalized[key]||'']));
    row.useStatus=normalized.useStatus||(normalized.unused?'未使用':'待填写');
    return row;
  });
  return p;
}
export const samePlan=(a,b)=>JSON.stringify(stable(comparablePlan(a||{})))===JSON.stringify(stable(comparablePlan(b||{})));
export function hasPlan(plan){
  return Boolean(plan&&(plan.basis?.trim()||plan.note?.trim()||(plan.decision&&plan.decision!=='待填写')||
    plan.products?.some(p=>p.unused===true||p.amount?.trim()||p.perDay?.trim()||p.note?.trim()||(p.useStatus&&!['待填写','待核对'].includes(p.useStatus)))));
}
export function planHistory(observation){
  if(!observation?.id)return [];
  const history=Array.isArray(observation.data?.planHistory)?observation.data.planHistory.filter(s=>s?.id&&s.plan):[];
  if(history.length)return history;
  const plan=observation.data?.plan;
  return hasPlan(plan)?[{id:'existing-'+observation.id,plan:cloneRecordData(plan),savedAt:observation.updated_at||observation.created_at||observation.actual_date||'',status:observation.status,legacy:true}]:[];
}
export function nextPlanHistory(existing,data,stage,status,{now=new Date().toISOString(),id=requestUUID,planDates=null}={}){
  const history=cloneRecordData(planHistory(existing));
  if(!stageFlow(stage)?.plan)return history;
  const last=history.at(-1),plan=data.plan;
  if(!hasPlan(plan)&&!last)return history;
  if(last&&samePlan({...last.plan,...planDates},plan)){
    // Confirming an unchanged draft does not create a fictitious product adjustment.
    last.status=status;return history;
  }
  history.push({id:id(),savedAt:now,status,plan:cloneRecordData(plan||{})});return history;
}
export function planEntries(caseId,observations,caseRecord){
  return [...new Set(['d1','d7','d14','d21',...observations.filter(o=>o.case_id===caseId&&Number(o.stage.slice(1))>21).map(o=>o.stage)])].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))).flatMap(stage=>{
    const observation=observations.find(o=>o.case_id===caseId&&o.stage===stage);
    const dates=firstPlanDates(caseRecord,stage);
    return planHistory(observation).map((entry,index,history)=>{
      const latest=index===history.length-1;
      const plan=latest&&dates?{...entry.plan,...dates}:entry.plan;
      return {...entry,plan,stage,number:index+1,latest,observationId:observation.id};
    });
  });
}
const planTime=value=>/^\d{2}:\d{2}[-—–]\d{2}:\d{2}$/.test(value||'')?'<span class="plan-time-range"><span>'+esc(value.slice(0,5))+'</span><span>—'+esc(value.slice(-5))+'</span></span>':esc(value||'未填写');
const planDate=value=>value?String(value).slice(0,10).replaceAll('-','.'):'未填写';
export function planUsageLabel(entry){
  const {startDate,endDate}=entry.plan||{};
  if(!startDate&&!endDate)return '使用日期待填写';
  return '使用日期 '+planDate(startDate)+' — '+planDate(endDate);
}
export const planStamp=value=>value?esc(new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})):'';
const FIRST_PLAN_SETS={d1:'第一套',d7:'第二套',d14:'第三套',d21:'第四套'};
export function planSetLabel(stage){
  const day=Number(stage?.slice(1));
  return FIRST_PLAN_SETS[stage]||(day>21&&validStage(stage)?'第'+(day/7+1)+'套':'');
}
export function planTitle(entry){
  const title=stageFlow(entry.stage)?.plan;
  const followup=Number(entry.stage?.slice(1))>21&&validStage(entry.stage);
  return title?(followup?planSetLabel(entry.stage)+title:title):entry.plan?.title||'产品方案';
}
export function planRevision(entry){
  const set=planSetLabel(entry.stage);
  if(entry.number>1)return (set?set+' · ':'')+'第'+(entry.number-1)+'次调整';
  return set+(entry.legacy?'原有版本':'初次方案');
}
export const planEdition=entry=>planRevision(entry)+(entry.status==='draft'?' · 草稿':'');
export function selectedPlanEntry(entries,{selected='',stage=''}={}){
  return entries.find(entry=>entry.id===selected)||entries.find(entry=>entry.latest&&entry.stage===stage)||entries.filter(entry=>entry.latest).at(-1);
}
export function planCard(c,entry,{demo=false}={}){
  const p=entry.plan||{},products=p.products||[];
  const rows=products.map(product=>{
    const unused=product.unused||['不安排','未使用'].includes(product.useStatus);
    const pending=!unused&&(!product.useStatus||['待填写','待核对'].includes(product.useStatus))&&!product.amount&&!product.perDay;
    return '<tr'+(unused||pending?' class="plan-inactive"':'')+'><td><strong>'+esc(product.name||'未命名产品')+'</strong><small>'+esc(productElementLabel(product))+'</small>'+(product.note?'<p class="plan-product-note">'+esc(product.note)+'</p>':'')+'</td><td>'+planTime(product.time)+'</td><td>'+(unused?'未用':pending?'待填写':esc(product.amount?product.amount+(product.unit?' '+product.unit:''):'未填写'))+'</td><td>'+(unused||pending?'—':esc(product.perDay?product.perDay+' 次':'未填写'))+'</td></tr>';
  }).join('');
  return '<article class="plan-card" aria-label="'+esc(planTitle(entry))+'"><header class="plan-card-header"><div><span class="plan-brand">上医 · 健康服务档案</span><h2>'+esc(c.name)+'</h2></div><span class="plan-edition">'+esc(planEdition(entry))+'</span></header><div class="plan-card-title"><h3>'+esc(planTitle(entry))+'</h3><p>'+esc(planUsageLabel(entry))+'</p></div>'+(p.decision&&p.decision!=='待填写'?'<p class="plan-decision">本次安排 · '+esc(p.decision)+'</p>':'')+'<table class="plan-product-table"><colgroup><col class="product-col"><col class="time-col"><col class="amount-col"><col class="frequency-col"></colgroup><thead><tr><th>产品</th><th>时间</th><th>每次量</th><th>每日</th></tr></thead><tbody>'+rows+'</tbody></table>'+(!products.length?'<p class="plan-empty">本版未安排产品。</p>':'')+(p.note?'<section class="plan-card-note"><h4>安排说明</h4><p>'+esc(p.note)+'</p></section>':'')+'<footer class="plan-card-footer"><span>记录人 '+esc(c.partner_name||'未填写')+'<br>保存于 '+planStamp(entry.savedAt)+'</span><span>'+esc(c.code)+'<br>'+esc(planRevision(entry))+'</span></footer><p class="plan-card-footnote">'+(demo?'虚构示例 · ':'')+'按已保存内容整理；实际使用请按产品标签及个人情况核对。</p></article>';
}
export function plansPage(c,observations,{selected='',stage='',owned=false,demo=false}={}){
  const entries=planEntries(c.id,observations,c);
  const selectedEntry=selectedPlanEntry(entries,{selected,stage});
  const groups=[...new Set(['d1','d7','d14',...entries.map(e=>e.stage)])].map(stage=>{
    const list=entries.filter(e=>e.stage===stage);
    return '<section class="plan-period"><h3>'+esc(planTitle({stage}))+'</h3>'+(list.length?'<div class="plan-versions">'+list.slice().reverse().map(entry=>'<a href="#/case/'+esc(c.id)+'/plans?version='+encodeURIComponent(entry.id)+'"'+(entry.id===selectedEntry?.id?' aria-current="true"':'')+'><span>'+esc(planRevision(entry))+'</span><small>'+(entry.savedAt?'保存于 '+planStamp(entry.savedAt):'')+(entry.status==='draft'?' · 草稿':'')+'</small></a>').join('')+'</div>':'<p>本阶段尚无已保存方案。</p>')+'</section>';
  }).join('');
  return '<section class="plans-workspace"><div class="plan-view-heading"><div><h2>产品方案</h2><p>每个阶段一张清单，每次调整保留一版。</p></div>'+(selectedEntry?'<div class="plan-view-actions"><button type="button" class="btn" data-action="plan-image">生成分享图片</button><button type="button" class="btn secondary" data-action="plan-capture">截图模式</button></div>':'')+'</div><div class="plans-layout"><aside class="plan-history" aria-label="选择阶段与版本">'+groups+'</aside><div class="plan-preview">'+(selectedEntry?planCard(c,selectedEntry,{demo})+(owned?'<a class="plan-edit-link" href="#/case/'+esc(c.id)+'?stage='+esc(selectedEntry.stage)+'">调整这个阶段的方案 →</a>':''):'<div class="empty panel"><h3>先保存一套产品方案</h3><p>填写首次观察中的第1—7天安排并保存，这里就会出现可截图的清单。</p>'+(owned?'<a class="btn" href="#/case/'+esc(c.id)+'?stage=d1">填写第一套方案</a>':'')+'</div>')+'</div></div><div class="plan-capture-tools"><button type="button" class="btn secondary" data-action="plan-capture-exit">返回档案</button><span>请使用手机截图；页面较长时可截长图。</span></div></section>';
}
