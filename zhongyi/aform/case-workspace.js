import {STAGES,esc,stageName} from './core.js?v=20261107-axis-1';
import {STAGE_FLOW,productElementLabel,productWithPlanTime} from './workflow.js?v=20261109-client-plans-1';

export function personalCases(cases,userId,{kind='client'}={}){
  if(!userId)return [];
  return cases.filter(c=>!c.deleted_at&&c.owner_id===userId&&(!kind||c.kind===kind));
}
export function preferredStage(caseId,observations,{requested='',remembered=''}={}){
  const valid=s=>STAGES.some(n=>'d'+n===s);
  if(valid(requested))return requested;
  if(valid(remembered)&&observations.some(o=>o.id&&o.case_id===caseId&&o.stage===remembered))return remembered;
  const saved=observations.filter(o=>o.case_id===caseId&&o.id&&valid(o.stage)).sort((a,b)=>
    String(b.updated_at||b.actual_date||b.created_at||'').localeCompare(String(a.updated_at||a.actual_date||a.created_at||''))||Number(b.stage.slice(1))-Number(a.stage.slice(1)));
  return saved[0]?.stage||'d1';
}
export function formFingerprint(form){
  // Disabled/readonly toggles during uploads do not change the underlying form data.
  return JSON.stringify([...form.elements].filter(e=>e.name&&!['file','submit','button','reset'].includes(e.type)&&(!['checkbox','radio'].includes(e.type)||e.checked))
    .flatMap(e=>e.tagName==='SELECT'&&e.multiple?[...e.selectedOptions].map(o=>[e.name,o.value]):[[e.name,e.value??'']]));
}
export function saveStateText({record,stage,dirty=false,photos=0,pending=0,demo=false}){
  const prefix=stageName(stage)+' · ';
  if(dirty)return prefix+'有修改待保存'+(photos?' · 已存照片 '+photos+' 张，无需重传':'');
  if(!record?.id)return prefix+'尚未填写 · 其他阶段的记录仍已保留';
  const saved=demo?'已保留在体验页面':record.status==='submitted'?'已保存到云端':'草稿已保存到云端';
  return prefix+saved+(photos?' · 照片 '+photos+' 张，无需重传':'')+(pending?' · '+pending+' 张待重试':'');
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
  return hasPlan(plan)?[{id:'existing-'+observation.id,plan:structuredClone(plan),savedAt:observation.updated_at||observation.created_at||observation.actual_date||'',status:observation.status,legacy:true}]:[];
}
export function nextPlanHistory(existing,data,stage,status,{now=new Date().toISOString(),id=()=>crypto.randomUUID()}={}){
  const history=structuredClone(planHistory(existing));
  if(!STAGE_FLOW[stage]?.plan)return history;
  const last=history.at(-1),plan=data.plan;
  if(!hasPlan(plan)&&!last)return history;
  if(last&&samePlan(last.plan,plan)){
    // Confirming an unchanged draft does not create a fictitious product adjustment.
    last.status=status;return history;
  }
  history.push({id:id(),savedAt:now,status,plan:structuredClone(plan||{})});return history;
}
export function planEntries(caseId,observations){
  return ['d1','d7','d14'].flatMap(stage=>{
    const observation=observations.find(o=>o.case_id===caseId&&o.stage===stage);
    return planHistory(observation).map((entry,index,history)=>({...entry,stage,number:index+1,latest:index===history.length-1,observationId:observation.id}));
  });
}
const planTime=value=>/^\d{2}:\d{2}[-—–]\d{2}:\d{2}$/.test(value||'')?'<span class="plan-time-range"><span>'+esc(value.slice(0,5))+'</span><span>—'+esc(value.slice(-5))+'</span></span>':esc(value||'未填写');
const date=value=>esc(value?String(value).slice(0,10).replaceAll('-','.'):'未填写');
const stamp=value=>value?esc(new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})):'';
export const planRevision=entry=>entry.number===1?(entry.legacy?'原有已保存版本':'初次方案'):'第 '+(entry.number-1)+' 次调整';
export function planCard(c,entry,{demo=false}={}){
  const p=entry.plan||{},products=p.products||[];
  const rows=products.map(product=>{
    const unused=product.unused||['不安排','未使用'].includes(product.useStatus);
    const pending=!unused&&(!product.useStatus||['待填写','待核对'].includes(product.useStatus))&&!product.amount&&!product.perDay;
    return '<tr'+(unused||pending?' class="plan-inactive"':'')+'><td><strong>'+esc(product.name||'未命名产品')+'</strong><small>'+esc(productElementLabel(product))+'</small>'+(product.note?'<p class="plan-product-note">'+esc(product.note)+'</p>':'')+'</td><td>'+planTime(product.time)+'</td><td>'+(unused?'未用':pending?'待填写':esc(product.amount?product.amount+(product.unit?' '+product.unit:''):'未填写'))+'</td><td>'+(unused||pending?'—':esc(product.perDay?product.perDay+' 次':'未填写'))+'</td></tr>';
  }).join('');
  return '<article class="plan-card" aria-label="'+esc(STAGE_FLOW[entry.stage]?.plan||'产品方案')+'"><header class="plan-card-header"><div><span class="plan-brand">上医 · 健康服务档案</span><h2>'+esc(c.name)+'</h2></div><span class="plan-edition">'+(entry.status==='draft'?'已存草稿':esc(planRevision(entry)))+'</span></header><div class="plan-card-title"><h3>'+esc(STAGE_FLOW[entry.stage]?.plan||p.title||'产品方案')+'</h3><p>'+date(p.startDate)+' — '+date(p.endDate)+'</p></div>'+(p.decision&&p.decision!=='待填写'?'<p class="plan-decision">本次安排 · '+esc(p.decision)+'</p>':'')+'<table class="plan-product-table"><colgroup><col class="product-col"><col class="time-col"><col class="amount-col"><col class="frequency-col"></colgroup><thead><tr><th>产品</th><th>时间</th><th>每次量</th><th>每日</th></tr></thead><tbody>'+rows+'</tbody></table>'+(!products.length?'<p class="plan-empty">本版未安排产品。</p>':'')+(p.note?'<section class="plan-card-note"><h4>安排说明</h4><p>'+esc(p.note)+'</p></section>':'')+'<footer class="plan-card-footer"><span>记录人 '+esc(c.partner_name||'未填写')+'<br>保存 '+stamp(entry.savedAt)+'</span><span>'+esc(c.code)+'<br>'+esc(planRevision(entry))+'</span></footer><p class="plan-card-footnote">'+(demo?'虚构示例 · ':'')+'按已保存内容整理；实际使用请按产品标签及个人情况核对。</p></article>';
}
export function plansPage(c,observations,{selected='',stage='',owned=false,demo=false}={}){
  const entries=planEntries(c.id,observations);
  const selectedEntry=entries.find(e=>e.id===selected)||entries.find(e=>e.latest&&e.stage===stage)||entries.filter(e=>e.latest).at(-1);
  const groups=['d1','d7','d14'].map(stage=>{
    const list=entries.filter(e=>e.stage===stage),flow=STAGE_FLOW[stage];
    return '<section class="plan-period"><h3>'+esc(flow.plan)+'</h3>'+(list.length?'<div class="plan-versions">'+list.slice().reverse().map(entry=>'<a href="#/case/'+esc(c.id)+'/plans?version='+encodeURIComponent(entry.id)+'"'+(entry.id===selectedEntry?.id?' aria-current="true"':'')+'><span>'+esc(planRevision(entry))+'</span><small>'+stamp(entry.savedAt)+(entry.status==='draft'?' · 草稿':'')+'</small></a>').join('')+'</div>':'<p>本阶段尚无已保存方案。</p>')+'</section>';
  }).join('');
  return '<section class="plans-workspace"><div class="plan-view-heading"><div><h2>产品方案</h2><p>每个阶段一张清单，每次调整保留一版。</p></div>'+(selectedEntry?'<div class="plan-view-actions"><button type="button" class="btn" data-action="plan-image">生成图片</button><button type="button" class="btn secondary" data-action="plan-capture">截图模式</button></div>':'')+'</div><div class="plans-layout"><aside class="plan-history" aria-label="选择阶段与版本">'+groups+'</aside><div class="plan-preview">'+(selectedEntry?planCard(c,selectedEntry,{demo})+(owned?'<a class="plan-edit-link" href="#/case/'+esc(c.id)+'?stage='+esc(selectedEntry.stage)+'">调整这个阶段的方案 →</a>':''):'<div class="empty panel"><h3>先保存一套产品方案</h3><p>填写首次观察中的第1—7天安排并保存，这里就会出现可截图的清单。</p>'+(owned?'<a class="btn" href="#/case/'+esc(c.id)+'?stage=d1">填写第一套方案</a>':'')+'</div>')+'</div></div><div class="plan-capture-tools"><button type="button" class="btn secondary" data-action="plan-capture-exit">返回档案</button><span>请使用手机截图；页面较长时可截长图。</span></div></section>';
}
