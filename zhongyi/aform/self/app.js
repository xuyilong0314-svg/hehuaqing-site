import {STAGES,ITEMS,ACTIONS,ACTION_VALUES,esc,stageLabel,today,validToken,readPayload,userError,requestUUID} from './core.js?v=20261118-self-1';
import {publicApiFetch} from '../auth.js?v=20261112-stability-1';
const root=document.querySelector('#app'),config=window.AFORM_CONFIG||{};
const token=location.hash.slice(1),demo=token==='demo',query=new URLSearchParams(location.search);
let context,requestId,submitting=false,dirty=false;
async function rpc(name,body){
 const response=await publicApiFetch(config.key)(config.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
 const result=await response.json();if(!response.ok)throw Error(result?.message||'暂未完成请求');return result;
}
function notice(title,message,retry=false){root.innerHTML='<section class="result"><span class="result-symbol">'+(retry?'↻':'—')+'</span><h1>'+title+'</h1><p>'+message+'</p>'+(retry?'<button class="primary" id="retry-open">重新打开</button>':'')+'</section>';document.querySelector('#retry-open')?.addEventListener('click',start);}
function completed(result){dirty=false;root.innerHTML='<section class="result"><span class="result-symbol done">✓</span><p class="stage-label">'+esc(stageLabel(result.stage))+'</p><h1>'+(demo?'体验填写完成':'您的自评已收到')+'</h1><p>'+(demo?'这是演示，内容没有上传。':'本次反馈已归入对应记录，<br>上医会结合您的情况继续跟进。')+'</p><div class="receipt">'+(result.submitted_at?'收到时间：'+esc(new Date(result.submitted_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})):'演示内容仅保留在本页')+'</div><p class="muted">'+(demo?'正式链接由上医从您的档案中发送。':'您可以关闭此页。如需更正，请联系上医重新发送链接；原记录会保留。')+'</p></section>';}
function render(){
 const s=context.stage;
 root.innerHTML=(demo?'<div class="demo-note">体验预览 · 虚构示例 · 不上传</div>':'')+'<section class="intro"><p class="stage-label">'+esc(stageLabel(s))+'</p><h1>说说您现在的感受</h1><p>'+esc(context.name_hint)+' · 记录尾号 '+esc(context.record_hint)+'<br>请按自己的实际感受填写。</p><div class="journey" aria-label="本次节点">'+STAGES.map(x=>'<span class="'+(x===s?'current':'')+'">'+x.slice(1)+'<small>天</small></span>').join('')+'</div></section><form id="self-form"><label class="date-field">实际记录日期<input type="date" name="actual_date" value="'+esc(context.today||today())+'" max="'+esc(context.today||today())+'" required></label><section class="form-section"><div class="section-title"><h2>五项体感</h2><span id="progress">已选 0 / 5 项</span></div><p class="hint">1 差 · 2 偏差 · 3 一般 · 4 较好 · 5 很好</p>'+ITEMS.map(([k,l])=>'<fieldset class="rating"><legend>'+l+'</legend><div class="rating-options">'+[1,2,3,4,5].map(n=>'<label><input type="radio" name="'+k+'" value="'+n+'" required aria-label="'+l+' '+n+' 分"><span>'+n+'</span></label>').join('')+'</div><label class="skip"><input type="radio" name="'+k+'" value="none">暂不评价</label></fieldset>').join('')+'</section>'+(s==='d1'?'':'<section class="form-section"><h2>四有行动</h2><p class="hint">按这段时间的实际情况选择，未约定的可直接标明。</p>'+ACTIONS.map(([k,l])=>'<fieldset class="action"><legend>'+l+'</legend><div class="action-options">'+ACTION_VALUES.map(v=>'<label><input type="radio" name="action_'+k+'" value="'+v+'"><span>'+v+'</span></label>').join('')+'</div></fieldset>').join('')+'</section>')+'<section class="form-section"><h2><label for="quote">还有什么想告诉上医？</label></h2><p class="hint">选填。可以写具体变化、感受，或执行中遇到的困难。</p><textarea id="quote" name="quote" maxlength="2000" rows="4" placeholder="例如：这几天晚上睡得晚，白天容易困。"></textarea></section><label class="consent"><input type="checkbox" name="consent" required><span>我确认这是本人的反馈，同意交给负责本档案的上医及原有授权管理人员，用于本次健康服务记录。</span></label><div id="form-error" role="alert" tabindex="-1" hidden></div><div class="submit-area"><button type="submit" class="primary">提交本次自评</button><p>照片与舌象观察由上医另行记录。</p></div></form>';
 const form=document.querySelector('#self-form');
 form.addEventListener('input',()=>{dirty=true;document.querySelector('#progress').textContent='已选 '+ITEMS.filter(([k])=>form.querySelector('input[name="'+k+'"]:checked')).length+' / 5 项';});
 form.addEventListener('submit',submit);
}
async function submit(event){
 event.preventDefault();if(submitting)return;
 const form=event.currentTarget,error=document.querySelector('#form-error'),button=form.querySelector('button[type=submit]');error.hidden=true;
 let payload;try{payload=readPayload(form,context.stage);}catch(e){error.textContent=e.message;error.hidden=false;error.focus();return;}
 submitting=true;button.disabled=true;button.textContent='正在提交…';
 // Freeze only during the request. Keep the filled DOM intact on network errors.
 const controls=[...form.querySelectorAll('input,textarea')];controls.forEach(el=>el.disabled=true);
 try{
  requestId ||= requestUUID();
  const result=demo?{status:'submitted',stage:context.stage}:await rpc('submit_client_self',{p_token:token,p_request_id:requestId,p_payload:payload});
  if(result?.status!=='submitted')throw Error('Unexpected response');
  completed(result);window.scrollTo({top:0,behavior:'instant'});
 }catch(e){error.textContent=userError(e);error.hidden=false;error.focus();button.disabled=false;button.textContent='重试提交';controls.forEach(el=>el.disabled=false);}
 finally{submitting=false;}
}
async function start(){
 if(!demo&&!validToken(token)){notice('请使用上医发来的专属链接','每个链接对应一位客户和一次记录。<br>请从聊天中重新打开完整链接。');return;}
 try{
  context=demo?{status:'ready',stage:STAGES.includes(query.get('stage'))?query.get('stage'):'d7',name_hint:'陈**（示例）',record_hint:'DEMO',today:today()}:await rpc('client_self_context',{p_token:token});
  if(context.status==='submitted'){completed(context);return;}
  if(context.status!=='ready'||!STAGES.includes(context.stage)){notice('这条自评链接已失效','请联系上医重新发送本次自评链接。');return;}
  render();
 }catch(e){notice('暂时没有连上','请检查网络后重试。<br>此页无需注册或登录。',true);}
}
window.addEventListener('beforeunload',e=>{if(dirty||submitting){e.preventDefault();e.returnValue='';}});
window.addEventListener('hashchange',()=>location.reload());
start();
