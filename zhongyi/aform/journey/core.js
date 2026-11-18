export const DAYS=[1,3,7,14,21];
export const ITEMS=[['spirit','精神'],['sleep','睡眠'],['appetite','食欲'],['bowel','排便'],['mood','情绪']];
export const ACTIONS=[['diet','饮食有节'],['movement','运动有度'],['emotion','情志有和'],['rest','起居有常']];
export const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
export const validToken=t=>/^[a-f0-9]{64}$/.test(t||'');
export const dateText=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.replaceAll('-','.'):'日期未填写';
export const imageSafe=s=>/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(s||'')&&s.length<=180000;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function link(mode,token,base=globalThis.location?.href){if(!['manage','share'].includes(mode)||!validToken(token))throw Error('链接暂不可用');const u=new URL(base);u.search='';u.hash=(mode==='manage'?'m=':'s=')+token;return u.href;}
export function initialOptions(content){return {stages:content.stages.filter(s=>s.recorded).map(s=>s.stage),ratings:true,quote:true,actions:false,photos:[],days:7,title:'我的健康记录',note:'',consent:false};}
export function previewContent(content,o){return {title:o.title.trim()||'我的健康记录',note:o.note,stages:content.stages.map(a=>{if(!o.stages.includes(a.stage))return {stage:a.stage,day:a.day,recorded:false,withheld:true,photos:[]};const {ratings,quote,actions,photos,...v}=a;return {...v,...(o.ratings&&ratings?{ratings}:{}),...(o.quote&&quote?{quote}:{}),...(o.actions&&actions?{actions}:{}),photos:(photos||[]).filter(p=>o.photos.includes(p.id))};})};}
export function stageStatus(s,current=today()){return s.withheld?'留给自己':s.recorded?'已记录':s.scheduled_date>current?'慢慢走到这里':'等你留下记录';}
export function scoresHTML(r){return '<div class="scores">'+ITEMS.map(([k,l])=>'<div><span>'+l+'</span><strong>'+(Number.isInteger(r?.[k])&&r[k]>=1&&r[k]<=5?r[k]:'—')+'</strong><small>/ 5</small></div>').join('')+'</div><p class="caption">1 差 · 2 偏差 · 3 一般 · 4 较好 · 5 很好；“—”表示未评价。</p>';}
export function stageHTML(s,{interactivePhotos=true}={}){
 if(!s)return '';
 const title={1:'从认识此刻的自己开始',3:'停一停，听听自己的感受',7:'把这一周，轻轻记下来',14:'回头看看走过的日子',21:'这一段的记录，留给以后的自己'}[s.day]||'继续把这一周，认真留下来';
 let body='';
 if(s.recorded){
  if(s.ratings)body+=scoresHTML(s.ratings);
  if(s.source)body+='<p class="source">记录来源 · '+esc(s.source)+'</p>';
  if(s.quote)body+='<blockquote><span>当时留下的话</span><p>'+esc(s.quote)+'</p></blockquote>';
  if(s.actions&&Object.keys(s.actions).length)body+='<dl class="habits">'+ACTIONS.filter(([k])=>s.actions[k]).map(([k,l])=>'<div><dt>'+l+'</dt><dd>'+esc(s.actions[k])+'</dd></div>').join('')+'</dl>';
  if(s.photos?.length)body+='<div class="photos">'+s.photos.filter(p=>imageSafe(p.image)).map(p=>'<figure>'+(interactivePhotos?'<button class="photo-open" data-photo="'+esc(p.id)+'" aria-label="放大第'+s.day+'天照片">':'<div>')+'<img src="'+esc(p.image)+'" alt="第'+s.day+'天，经选择的记录照片" loading="lazy">'+(interactivePhotos?'</button>':'</div>')+'<figcaption>'+dateText(p.taken_on)+'</figcaption></figure>').join('')+'</div>';
  if(!s.ratings&&!s.quote&&!s.photos?.length&&!Object.keys(s.actions||{}).length)body+='<p class="empty-note">这一天，留下过一次记录。具体内容留给了自己。</p>';
 }else body='<p class="empty-note">'+(s.withheld?'这一页，暂时留给自己。':'不必赶进度。愿意的时候，再把真实的感受记下来。')+'</p>';
 return '<article class="stage-story"><div class="story-heading"><div><p class="eyebrow">第 '+s.day+' 天</p><h2>'+title+'</h2></div><span class="date">'+(s.recorded?dateText(s.actual_date):stageStatus(s))+'</span></div>'+body+'</article>';
}
export const DEMO_CONTENT={started_on:'2026-11-12',stages:DAYS.map((n,i)=>({stage:'d'+n,day:n,scheduled_date:new Date(Date.UTC(2026,10,11+n)).toISOString().slice(0,10),recorded:i<3,photos:[],...(i<3?{actual_date:'2026-11-'+String(11+n).padStart(2,'0'),source:'本人自评',ratings:{spirit:[3,3,4][i],sleep:[2,3,3][i],appetite:[3,4,3][i],bowel:[3,null,4][i],mood:[3,3,4][i]},quote:['想试着认真记下自己的状态，从今天开始。','这两天工作比较忙。昨晚早点放下手机，给自己留了一会儿安静的时间。','一周过去，状态也有起伏。能停下来听听自己的感受，我觉得很好。'][i],actions:i?{diet:'部分落实',movement:'部分落实',rest:'已落实',emotion:'尚未约定'}:{}}:{})}))};
