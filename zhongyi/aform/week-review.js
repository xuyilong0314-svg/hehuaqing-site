import {esc,stageName,validStage,validDate} from './core.js?v=20261126-actual-start-1';
import {caseTimeline,visitPhotos} from './comparison.js?v=20261126-week-review-1';
import {planEntries,planTitle,planUsageLabel} from './case-workspace.js?v=20261126-week-review-1';
import {choiceGroup,TONGUE_COMPARE_FIELDS} from './workflow.js?v=20261126-week-review-1';

const dayOf=stage=>Number(stage?.slice(1));
const dateText=value=>validDate(value)?value.replaceAll('-','.'):'';
export const hasWeekReview=stage=>validStage(stage)&&dayOf(stage)>=7;
const previousWeekStage=stage=>dayOf(stage)===7?'d1':'d'+(dayOf(stage)-7);
const compareChoices=[['主观感觉改善','好转'],'不变',['主观感觉变差','变差'],'未评'];
const allowed=new Set(compareChoices.map(choice=>Array.isArray(choice)?choice[0]:choice));
const aliases={'好转':'主观感觉改善','变差':'主观感觉变差'};
const normalized=values=>Object.fromEntries(TONGUE_COMPARE_FIELDS.map((_,i)=>{
  const value=aliases[values?.[i]]||values?.[i];
  return [i,allowed.has(value)?value:'未评'];
}));

function referenceOptions(c,stage,observations,observation){
  const earlier=observations.filter(o=>o.case_id===c.id&&validStage(o.stage)&&dayOf(o.stage)<dayOf(stage));
  const records=new Map(earlier.map(o=>[o.stage,o]));
  if(!records.has('d1'))records.set('d1',{stage:'d1'});
  const saved=observation?.data?.weekComparison?.reference;
  if(validStage(saved)&&dayOf(saved)<dayOf(stage)&&!records.has(saved)){
    records.set(saved,{stage:saved,actual_date:observation.data.weekComparison.byStage?.[saved]?.on});
  }
  return [...records.values()].sort((a,b)=>dayOf(b.stage)-dayOf(a.stage));
}

function selectedReference(choices,stage,observation){
  const saved=observation?.data?.weekComparison?.reference;
  return choices.find(o=>o.stage===saved)?.stage
    ||choices.find(o=>o.id&&o.stage===previousWeekStage(stage))?.stage
    ||choices.find(o=>o.id)?.stage||'d1';
}

const savedRatings=(o,stage)=>normalized(o?.data?.weekComparison?.byStage?.[stage]?.ratings||(stage==='d1'?o?.data?.compare:null));
const fieldRatings=data=>normalized(Object.fromEntries(TONGUE_COMPARE_FIELDS.map((_,i)=>[i,data.get('compare_'+i)])));
function pendingRatings(value){
  try{return Object.fromEntries(Object.entries(JSON.parse(value||'{}')).filter(([stage])=>validStage(stage)));}
  catch{return {};}
}

export function changeWeekReference(form,observation){
  const panel=form.querySelector('.week-review');
  const ref=form.elements.week_compare_reference.value;
  const drafts=form.elements.week_compare_drafts;
  const pending=pendingRatings(drafts.value);
  const previous=panel.dataset.reference;
  if(!panel.querySelector('.week-review-assessment').disabled){
    const current=fieldRatings(new FormData(form));
    if(JSON.stringify(current)===JSON.stringify(savedRatings(observation,previous)))delete pending[previous];
    else pending[previous]=current;
    drafts.value=Object.keys(pending).length?JSON.stringify(pending):'';
  }
  panel.dataset.reference=ref;
  const scores=pending[ref]||savedRatings(observation,ref);
  for(const input of panel.querySelectorAll('input[type=radio]'))input.checked=input.value===scores[input.name.slice(8)];
}

export function readWeekAssessment(data,c,stage,observations,observation){
  const reference=data.get('week_compare_reference');
  if(!hasWeekReview(stage)||!reference)return {compare:fieldRatings(data)};
  const choices=referenceOptions(c,stage,observations,observation);
  if(!choices.some(o=>o.stage===reference))throw Error('这次对照记录已变动，请重新选择。');
  const previous=observation?.data||{};
  const byStage={...previous.weekComparison?.byStage};
  const updated={...pendingRatings(data.get('week_compare_drafts')),[reference]:fieldRatings(data)};
  for(const item of choices){
    if(updated[item.stage]){
      byStage[item.stage]={on:item.actual_date||'',ratings:normalized(updated[item.stage])};
    }
  }
  return {compare:byStage.d1?.ratings||previous.compare||{},weekComparison:{reference,byStage}};
}

function productRows(products){
  return Array.isArray(products)?products.filter(p=>p?.name&&(p.amount||p.perDay||p.note||p.unused||p.useStatus&&!['待填写','待核对'].includes(p.useStatus))):[];
}
function productTable(products,label){
  return '<section class="week-review-products"><h4>'+esc(label)+'</h4><div class="week-review-table"><table>'+
    '<thead><tr><th>产品</th><th>状态</th><th>时间</th><th>每次量</th><th>每日次数</th></tr></thead><tbody>'+
    products.map(p=>{
      const status=p.useStatus||(p.unused?'未用':'');
      const values=[p.name,status,p.time,p.amount&&[p.amount,p.unit].filter(Boolean).join(' '),p.perDay];
      return '<tr>'+values.map((v,i)=>i===0?'<th scope="row">'+esc(v)+'</th>':'<td>'+esc(v||'—')+'</td>').join('')+'</tr>';
    }).join('')+'</tbody></table></div></section>';
}

export function weekReviewContent(c,stage,reference,observations,photos,url){
  const timeline=caseTimeline(c.id,observations,photos);
  const previous=timeline.find(o=>o.stage===reference);
  const current=timeline.find(o=>o.stage===stage)||{stage,photos:photos.filter(p=>p.case_id===c.id&&p.stage===stage)};
  const plan=planEntries(c.id,observations,c).find(e=>e.latest&&e.stage===previousWeekStage(stage));
  const planned=productRows(plan?.plan.products);
  const actual=productRows(current.data?.products);
  const earlier=productRows(previous?.data?.products);
  return '<div class="week-review-photos">'+visitPhotos(previous,url,'所选记录')+visitPhotos(current,url,'本次')+'</div>'+
    (actual.length?productTable(actual,'本次已记录的实际使用'):'<p class="small muted">本次尚无逐项实际使用记录。</p>')+
    (planned.length?productTable(planned,'上一周已保存方案 · '+planTitle(plan))+
      '<p class="small muted">'+esc(planUsageLabel(plan))+'</p>':'<p class="small muted">上一周没有已保存的逐项产品方案。</p>')+
    (earlier.length?productTable(earlier,stageName(previous.stage)+'回访中记录的实际使用'):'');
}

export function weekReviewMarkup(c,stage,observations,photos,url,{owner=false}={}){
  if(!hasWeekReview(stage))return '';
  const current=observations.find(o=>o.case_id===c.id&&o.stage===stage);
  const choices=referenceOptions(c,stage,observations,current);
  const ref=selectedReference(choices,stage,current);
  const scores=savedRatings(current,ref);
  const options=choices.map(o=>{
    const weekly=o.id&&o.stage===previousWeekStage(stage)?'上一周 · ':'';
    const status=o.status==='draft'?'（草稿）':o.id?'':'（记录未找到）';
    return '<option value="'+o.stage+'"'+(o.stage===ref?' selected':'')+'>'+weekly+esc(stageName(o.stage))+
      (o.actual_date?' · '+dateText(o.actual_date):'')+status+'</option>';
  }).join('');
  return '<section class="week-review paper-section" id="week-review" tabindex="-1" data-reference="'+ref+'">'+
    '<h3>上周对照</h3><label class="field">对照哪次观察<select class="input" name="week_compare_reference">'+options+'</select></label>'+
    '<input type="hidden" name="week_compare_drafts" value=""><div data-week-review-content>'+weekReviewContent(c,stage,ref,observations,photos,url)+'</div>'+
    '<fieldset class="week-review-assessment"'+(owner?'':' disabled')+'><legend>本次舌象与所选记录比较</legend><div class="record-select-grid">'+
    TONGUE_COMPARE_FIELDS.map((label,i)=>choiceGroup(label,'compare_'+i,scores[i],compareChoices)).join('')+
    '</div><p class="small muted">同条件观察。未观察或看不清时选「未评」。</p></fieldset></section>';
}
