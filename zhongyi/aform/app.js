import {requestUUID} from './self/core.js?v=20261118-progress-2';
import {installFormValidation} from './form-validation.js?v=20261121-field-focus-1';
import {transferPhoto,savePhotoRecord,photoUploadMessage,photoDiagnostic} from './photo-transfer.js?v=20261121-photo-2';
import {safeHealthRoute,captureReturn,pendingReturn,rememberReturn,clearReturn} from '../../account/return-to.js?v=20261119-ux-1';
const loginDestination=captureReturn();
if(new URLSearchParams(location.search).has('return')){const entry=new URL(location.href);entry.searchParams.delete('return');history.replaceState(history.state,'',entry.pathname+entry.search+entry.hash);}
import {beginLoading,singleFlight,withLoading} from '../../account/loading.js?v=20261119-ux-1';
import {birthDateField,syncBirthDate,ageFromBirthDate} from './birth-date.js?v=20261121-member-age-1';
import {stageRail,stageButtons,progressPanel,openProgress,demoProgress,stateLabel,syncSuggestion} from './progress.js?v=20261121-photo-visibility-2';
import {journeyEntry,openJourneyOwner} from './journey-owner.js?v=20261121-share-dates-1';
import {normalizeIdentity,caseIdentity,syncCaseIdentity,birthBadges,birthSummary,syncBirthSummary,birthDateLabel} from '../../account/identity.js?v=20261121-member-age-1';
import {latestSelf,projectedSelf,selfRatings,selfPanel,selfOverview,selfLink,loadSelf} from './client-self.js?v=20261118-progress-2';
import {loadAccountSdk} from '../../account/sdk.js?v=20261112-complete-1';
import {browserSessionStorage,sessionPersistence,temporarySessionNotice} from '../../account/session-storage.js?v=20261112-complete-1';
import {mountEmailPanel,completeEmailVerification} from '../../account/email-status.js?v=20261119-ux-1';
import {rememberPendingEmail,verificationUrl} from '../../account/verification.js?v=20261112-deferred-1';
import {profileFields,profileFromForm,signupFields,signupProfileFromForm,readPersonalProfile,savePersonalProfile,syncStudyField,ProfileError} from '../../account/profile.js?v=20261121-member-age-1';
import {openPlanImage} from './plan-image.js?v=20261120-mobile-save-1';
import {personalCases,preferredStage,formFingerprint,saveStateText,nextPlanHistory,planEntries,hasPlan,plansPage} from './case-workspace.js?v=20261121-photo-visibility-2';
import {authIssue} from '../../account/auth-support.js?v=20261119-ux-1';
import {duplicateNames,memberCard,deletionDialog,matchingEmail,memberError} from './member-admin.js?v=20261121-list-age-2';
import {memberDetailMarkup,memberDetailError} from './member-detail.js?v=20261121-member-age-1';
import {registrationOutcome,registrationCopy} from './registration.js?v=20261112-deferred-1';
import {publicApiFetch,authReturnUrl,authCallback} from './auth.js?v=20261119-ux-1';
import {STAGES,ITEMS,PRODUCTS,NEEDS,FEELINGS,esc,today,addDays,dayNumber,stageName,nextFollow,stageDays,stageSchedule,stageRecord,extensionReady,applyActualFollowup,csv,canTeach,cleanImageType,caseStageActivity,caseActivityText} from './core.js?v=20261121-photo-visibility-2';
import {accountRole,roleName,summarize,memberSummaries,archiveFilter,managementHome} from './management.js?v=20261118-progress-2';
import {renderStageForm,readWorkflow,readProductRows,FOUR_ACTIONS,DETAIL_COLUMNS,detailValues,productWithPlanTime,productTemplate,paperPlanRows,choiceGroup,productElementLabel,readAxis,syncAxisChoices,syncActualDateFields} from './workflow.js?v=20261121-photo-visibility-2';
import {createPhotoTasks,runPhotoBatch,uploadCounts,renderUploadFeedback} from './photo-upload.js?v=20261121-photo-visibility-2';
import {caseTimeline,comparisonAt,comparisonDetail,comparisonCards,savedPhotoPreview,photoPreviewBody} from './comparison.js?v=20261121-photo-visibility-2';
const config=window.AFORM_CONFIG||{};
const root=document.querySelector('#app');
// The public-site navigation remains outside the app's route-rendered content.
const siteMenu=document.querySelector('#aform-site-menu');
document.addEventListener('click',e=>{if(siteMenu?.open&&!siteMenu.contains(e.target))siteMenu.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&siteMenu?.open){siteMenu.open=false;siteMenu.querySelector('summary').focus();}});
window.addEventListener('pageshow',()=>{if(siteMenu)siteMenu.open=false;});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-password-toggle]');
 if(!button||busy)return;
 const input=document.getElementById(button.dataset.passwordToggle);if(!input)return;
 const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'隐藏':'显示';
 button.setAttribute('aria-pressed',String(show));
 const label=document.querySelector('label[for="'+input.id+'"]')?.textContent||'密码';
 button.setAttribute('aria-label',(show?'隐藏':'显示')+label);
});


const icons={home:'<path d="M3 10 12 3l9 7v10H3z"/><path d="M9 20v-7h6v7"/>',folder:'<path d="M3 6h7l2 3h9v11H3z"/>',plus:'<path d="M12 4v16M4 12h16"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',chart:'<path d="M4 4v16h17M8 15l4-5 4 2 5-7"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',camera:'<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1-3h6l1 3"/>',export:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>'};
icons.book='<path d="M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zm0 0v16"/>';
const icon=k=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+icons[k]+'</svg>';
const brand='<div class="brand"><div class="mark">上</div><div><strong>上医健康管理服务表</strong><small>古中医阴阳五行舌</small></div></div>';
let db=null,user=null,profile={},staff=false,role='student',members=[],choosingPhoto=false,demo=false,teacherDemo=false,dirty=false,busy=false,cases=[],archivedCases=[],obs=[],photos=[],reviews=[],activeStage='d1',currentCase=null,lastHash='',draftProducts=[],draftPlanProducts=[];
let signed=new Map(),toastTimer,loaded=false,authMode='login',authMessage='',profileError='',loadId=0,requestedRoute=safeHealthRoute(location.hash)||safeHealthRoute(loginDestination.split('#')[1])||'/home';
let registrationResult=null,memberDeletion=null,activeMember=null,memberChecking=false,memberViewEpoch=0;
const photoBatches=new Map();
let photoController=null;
const stageMemory=new Map(),formBaselines=new WeakMap();
let recordListRoute='';
let selfResponses=[],selfLoadError='',selfBusy=false;
function rememberForm(form=document.querySelector('#observation-form,#case-form,#review-form,#profile-form')){if(form)formBaselines.set(form,formFingerprint(form));}
function syncFormDirty(){const form=document.querySelector('#observation-form,#case-form,#review-form,#profile-form');if(form&&formBaselines.has(form))dirty=formFingerprint(form)!==formBaselines.get(form);}
function updateSaveState(){
 const form=document.querySelector('#observation-form'),state=form?.querySelector('#save-state');if(!state||!currentCase)return;
 const record=obs.find(o=>o.case_id===currentCase.id&&o.stage===activeStage);
 state.textContent=saveStateText({record,stage:activeStage,dirty,demo,photos:photos.filter(p=>p.case_id===currentCase.id&&p.stage===activeStage).length,pending:uploadCounts(photoBatches.get(photoBatchKey())?.items||[]).pending});
 if(form.dataset.clientSelfId&&form.dataset.clientSelfId!==record?.data?.clientSelfId)state.textContent='客户自评已载入，请补充上医记录后保存';
 const draft=form.querySelector('button[value="draft"]');if(draft)draft.disabled=busy||Boolean(record&&!dirty&&(!form.dataset.clientSelfId||form.dataset.clientSelfId===record.data?.clientSelfId));
 const submitted=record?.status==='submitted'&&!dirty;
 const submit=form.querySelector('button[value="submitted"]');if(submit)submit.textContent=submitted?'查看已提交对照':'提交并查看对照';
 const advance=form.querySelector('button[value="continue"]');if(advance)advance.textContent=(submitted?'':'提交并')+advance.dataset.advanceLabel;
}
function ownCases(kind='client'){return personalCases(cases,demo?'demo':user?.id,{kind});}
function archiveSwitch(active){return '<nav class="archive-scope" aria-label="档案范围"><a href="#/clients"'+(active==='clients'?' aria-current="page"':'')+'>我的客户 <b>'+ownCases().length+'</b></a><a href="#/clients?kind=self"'+(active==='self'?' aria-current="page"':'')+'>本人记录</a>'+(isTeacher()?'<a href="#/records"'+(active==='all'?' aria-current="page"':'')+'>全部档案 <b>'+cases.length+'</b></a>':'')+'</nav>';}
function clientsPage(){
 const kind=new URLSearchParams(cleanHash().split('?')[1]||'').get('kind')==='self'?'self':'client',list=ownCases(kind);
 return shell('<div class="page-heading"><div><div class="eyebrow">我的服务 · 持续跟进</div><h1>'+(kind==='self'?'本人记录':'我的客户')+'</h1><p>'+(kind==='self'?'自己的观察与日常记录。':'只显示归属您账号的客户档案。')+'</p></div><a class="btn" href="#/new">'+icon('plus')+'为新会员建档</a></div>'+archiveSwitch(kind==='self'?'self':'clients')+'<div class="personal-record-summary"><strong>'+list.length+'</strong><span>'+(kind==='self'?'份本人记录':'位客户')+'</span><small>按建档时间排列</small></div><label class="personal-record-search">查找'+(kind==='self'?'记录':'客户')+'<input id="client-search" class="input" type="search" placeholder="称呼、档案编号或班级"></label><div id="client-list" class="record-list">'+list.map(recordRow).join('')+(!list.length?'<div class="empty panel"><h3>'+(kind==='self'?'还没有本人记录':'开始您的第一份客户档案')+'</h3><p>通过您的账号建档后，会出现在这里。</p><a class="btn secondary" href="#/new">建立档案</a></div>':'')+'</div>','clients');
}
function filterClients(){const kind=new URLSearchParams(cleanHash().split('?')[1]||'').get('kind')==='self'?'self':'client',q=(document.querySelector('#client-search')?.value||'').trim().toLowerCase();const list=ownCases(kind).filter(c=>[c.name,c.code,c.class_name].join(' ').toLowerCase().includes(q));document.querySelector('#client-list').innerHTML=list.length?list.map(recordRow).join(''):'<div class="empty">没有符合条件的记录。</div>';}

const photoBatchKey=(c=currentCase,stage=activeStage)=>c?c.id+':'+stage:'';
function clearPhotoBatches(){photoController?.abort();photoController=null;for(const batch of photoBatches.values())for(const item of batch.items)URL.revokeObjectURL(item.preview);photoBatches.clear();}
const hasPendingPhotos=()=>[...photoBatches.values()].some(b=>uploadCounts(b.items).pending>0);
const live=()=>config.ready===true;
const isTeacher=()=>demo?teacherDemo:staff;
function notify(message){const e=document.querySelector('#toast');e.textContent=message;e.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.style.display='none',4000);}
const checkResult=r=>{if(r.error)throw r.error;return r.data;};
function friendly(e){if(/^Auth/.test(e?.name||'')||String(e?.code||'').startsWith('client_')){const issue=authIssue(e);return issue.text+'（'+issue.reference+'）';}const m=e?.message||String(e);if(m.includes('version_conflict')||m.includes('0 rows'))return '记录已在别处更新。请先复制当前修改，再刷新核对。';if(m.includes('Invalid login'))return '邮箱或密码不正确。';if(m.includes('Email not confirmed'))return '请打开注册邮箱中的验证邮件，点击链接后再登录。';if(m.includes('User already registered'))return '此邮箱已注册，请直接登录或找回密码。';if(m.includes('Password should be at least')||m.includes('password_too_short'))return '密码至少需要 6 位。';if(m.includes('weak_password')||m.includes('pwned')||m.includes('Password is known'))return '这个密码暂时无法使用，请换一个密码再试。';if(m.includes('Unable to validate email')||m.includes('email_address_invalid'))return '邮箱格式无效，请检查后重试。';if(m.includes('email rate limit')||m.includes('rate limit'))return '操作较频繁，请稍后重试。';if(m.includes('row-level')||m.includes('permission'))return '当前账号没有这份记录的操作权限。';if(m.includes('Failed to fetch'))return '网络连接未成功。内容仍保留在页面，请检查网络后重试。';return m;}
function errBox(message){return '<div class="error" role="alert">'+esc(message)+'</div>';}
function dateText(v){return v?esc(v.replaceAll('-','.')):'未约定';}
function cleanHash(){return location.hash.replace(/^#/,'')||'/';}
function finishLogin(){const target=pendingReturn()||loginDestination;clearReturn();if(target&&!target.startsWith('/zhongyi/aform/#')){location.assign(target);return;}go(safeHealthRoute(target.split('#')[1])||requestedRoute);}
function go(path){if(dirty&&!confirm('有尚未保存的内容，确定离开吗？'))return;dirty=false;if(cleanHash()===path)render();else location.hash=path;}
function field(label,name,value='',type='text',extra=''){
 const input='<input class="input" id="'+esc(name)+'" name="'+esc(name)+'" type="'+type+'" value="'+esc(value)+'" '+extra+'>';
 const control=type==='password'?'<div class="password-control">'+input+'<button type="button" class="password-toggle" data-password-toggle="'+esc(name)+'" aria-label="显示'+label+'" aria-pressed="false">显示</button></div>':input;
 return '<div class="field"><label class="label" for="'+esc(name)+'">'+label+'</label>'+control+'</div>';
}
function area(label,name,value='',placeholder=''){return '<div class="field"><label class="label" for="'+esc(name)+'">'+label+'</label><textarea id="'+esc(name)+'" name="'+esc(name)+'" maxlength="3000" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea></div>';}
function select(label,name,value,options){return '<div class="field"><label class="label" for="'+esc(name)+'">'+label+'</label><select id="'+esc(name)+'" name="'+esc(name)+'">'+options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return '<option value="'+esc(v)+'"'+(v===value?' selected':'')+'>'+esc(l)+'</option>';}).join('')+'</select></div>';}
function checks(name,values,options){return '<div class="check-group">'+options.map(v=>'<label class="check-pill"><input type="checkbox" name="'+name+'" value="'+esc(v)+'"'+(values?.includes(v)?' checked':'')+'>'+esc(v)+'</label>').join('')+'</div>';}
function checkbox(name,label,checked=false,help=''){return '<label class="check"><input type="checkbox" name="'+name+'"'+(checked?' checked':'')+'><span>'+label+(help?'<em>'+help+'</em>':'')+'</span></label>';}
const colors=['#416d50','#aa8550','#5d8790','#968a6e','#8c6872'];
function trend(observations){const list=observations.filter(o=>o.status==='submitted'&&o.actual_date).sort((a,b)=>a.actual_date.localeCompare(b.actual_date));if(!list.length)return '<div class="empty">提交首次观察后，这里会形成连续记录。</div>';const w=480,h=160,x=i=>40+i*(400/Math.max(1,list.length-1)),y=v=>135-(v-1)*28;let s='<svg class="chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="五项主观体感随日期的记录趋势">';for(let n=1;n<=5;n++)s+='<line x1="30" y1="'+y(n)+'" x2="460" y2="'+y(n)+'" stroke="#e0e5da"/><text x="10" y="'+(y(n)+4)+'" font-size="10" fill="#6b786c">'+n+'</text>';ITEMS.forEach(([key],idx)=>{let prev=null;list.forEach((o,i)=>{const v=o.data?.ratings?.[key];if(!v){prev=null;return;}if(prev)s+='<line x1="'+x(prev.i)+'" y1="'+y(prev.v)+'" x2="'+x(i)+'" y2="'+y(v)+'" stroke="'+colors[idx]+'" stroke-width="2"/>';s+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3" fill="'+colors[idx]+'"/>';prev={i,v};});});list.forEach((o,i)=>s+='<text x="'+x(i)+'" y="156" text-anchor="middle" font-size="10" fill="#6b786c">'+esc(o.actual_date.slice(5))+'</text>');return s+'</svg><div class="legend">'+ITEMS.map(([,l],i)=>'<span><i style="background:'+colors[i]+'"></i>'+l+'</span>').join('')+'</div><p class="small muted mt mb">本人主观评分 · 1 差，5 很好；未评的数据不连接。</p>';}
function examplePhoto(label,day){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="#e8e5dc"/><rect x="65" y="62" width="370" height="376" rx="14" fill="#f7f4ec" stroke="#bdc8b6"/><path d="M165 230h170v110H165zM195 230l15-25h80l15 25" fill="none" stroke="#8b9e82" stroke-width="4"/><circle cx="250" cy="283" r="34" fill="none" stroke="#8b9e82" stroke-width="4"/><text x="250" y="130" font-size="24" text-anchor="middle" fill="#244938" font-family="sans-serif">'+label+'</text><text x="250" y="170" font-size="18" text-anchor="middle" fill="#777e6d" font-family="sans-serif">'+day+'</text><text x="250" y="394" font-size="16" text-anchor="middle" fill="#777e6d" font-family="sans-serif">演示示意 · 非真实舌照</text></svg>');}
function seedDemo(){const d=addDays(today(),-6);cases=[{id:'demo-1',code:'A260001',name:'林女士',kind:'client',created_on:d,class_name:'第五期 · 泉州',partner_name:'演示学员',contact:'',consent_record:true,consent_photo:true,consent_teaching:true,version:1,owner_id:'demo',baseline:{needs:[NEEDS[0]],feelings:['睡眠不稳'],wish:'记录日常作息和精神状态',detail:'本条为虚构示例。',allergy:'未填写',meds:'未填写'}},{id:'demo-2',code:'A260002',name:'我的记录',kind:'self',created_on:addDays(today(),-1),class_name:'第五期 · 泉州',partner_name:'演示学员',contact:'',consent_record:true,consent_photo:false,consent_teaching:false,version:1,owner_id:'demo',baseline:{}}];obs=[1,3,7].map((n,i)=>({id:'demo-o'+n,case_id:'demo-1',stage:'d'+n,actual_date:addDays(d,n-1),status:'submitted',version:1,data:{ratings:{spirit:[3,3,4][i],sleep:[2,3,3][i],appetite:[3,4,3][i],bowel:[3,3,4][i],mood:[3,4,4][i]},quote:'示例：按实际情况记录，不以变化判定疗效。',tongue:{gloss:'待定',strength:'待定',coating:'待定',source:'未观察'},nextDate:addDays(d,13)}}));photos=[{id:'demo-p1',file_no:'P001',case_id:'demo-1',stage:'d1',taken_on:d,url:examplePhoto('首次观察','第 1 天'),uploader_name:'演示学员'},{id:'demo-p2',file_no:'P002',case_id:'demo-1',stage:'d7',taken_on:addDays(d,6),url:examplePhoto('再次观察','第 7 天'),uploader_name:'演示学员'}];reviews=[{case_id:'demo-1',org_status:'pending',tags:['连续观察'],comment:'此处为老师独立整理的教学笔记。'}];profile={display_name:'演示学员',class_name:'第五期 · 泉州'};loaded=true;}
function beginDemo(){archivedCases=[];demo=true;teacherDemo=false;role='student';members=[];dirty=false;seedDemo();go('/home');}
function registrationPage(){
 const state=registrationResult?.state||'missing',[title,description]=registrationCopy(state),success=state==='success';
 const fromSite=new URLSearchParams(location.search).get('from')==='site';
 document.title=title+' · 何华清';
 const mark=success?'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m13 24 8 8 15-17"/></svg>':state==='pending'?'…':'!';
 return '<div class="wrap"><header class="site-head"><a class="verification-brand" href="../../#home">何华清<span>我的账号</span></a></header><main class="auth-shell verification-shell"><section class="panel verification-panel '+(success?'verification-success':'')+'" aria-labelledby="verification-title" aria-live="polite" aria-busy="'+(state==='pending')+'"><div class="verification-mark '+(success?'is-success':'')+'" aria-hidden="true">'+mark+'</div><h1 id="verification-title" tabindex="-1">'+title+'</h1>'+(success?'<p class="verification-welcome">很高兴，在这里遇见您。</p>':'')+'<p class="verification-description">'+description+'</p>'+(success?'<button type="button" class="btn full" data-action="verification-continue" data-destination="'+(fromSite?'site':'health')+'">'+(fromSite?'进入网站':'进入健康记录')+' →</button><button type="button" class="btn secondary full" data-action="verification-continue" data-destination="'+(fromSite?'health':'site')+'">'+(fromSite?'填写健康记录':'先去读书')+'</button><p class="verification-footnote">一个账号，阅读与记录都在这里。</p>':(state==='retry'?'<button type="button" class="btn full" data-action="verification-retry">重新确认</button>':'')+'<a class="btn full" href="../../account/verify/">重新验证邮箱</a><button type="button" class="btn full secondary" data-action="verification-login">返回登录</button>')+'</section></main><footer class="site-foot verification-footer"><span>何华清 · 阅读与日常</span><a href="../../analytics/privacy.html">隐私与账号说明</a></footer></div>';
}
async function checkRegistration(callback={}){
 const pending={state:'pending'};registrationResult=pending;root.innerHTML=registrationPage();
 const result=await registrationOutcome(db.auth,callback);
 if(result.state==='success'&&callback.signup){try{await completeEmailVerification(db,result.user.id);}catch{/* Keep login available; personal page shows the actual saved status. */}}
 if(registrationResult!==pending)return;
 if(result.user)user=result.user;
 registrationResult=result;
 history.replaceState(null,'',location.pathname+location.search+'#/registration-result');lastHash=location.hash;
 await render();window.scrollTo(0,0);document.querySelector('#verification-title')?.focus({preventScroll:true});
}
async function continueRegistration(destination){
 if(registrationResult?.state!=='success')return;
 if(destination==='site'){location.assign('../../#home');return;}
 user=registrationResult.user;registrationResult=null;authMode='login';authMessage='';document.title='上医健康管理服务表';
 try{await loadProfile();loaded=false;finishLogin();}catch{go(requestedRoute);}
}
function returnToLogin(){
 registrationResult=null;document.title='上医健康管理服务表';authMode='login';authMessage='';go('/login');
}
async function fetchAdminMembers(){
 const all=[];for(let from=0;;from+=200){const rows=checkResult(await db.rpc('list_site_members').range(from,from+199))||[];all.push(...rows);if(rows.length<200)return all;}
}
function openMemberDeletion(id){return withLoading({theme:'account',title:'正在读取账号信息'},()=>openMemberDeletionContent(id));}
async function openMemberDeletionContent(id){
 if(demo||role!=='admin')return;
 busy=true;
 try{memberDeletion=checkResult(await db.rpc('preview_site_member_deletion',{p_user_id:id}));dialog(deletionDialog(memberDeletion));}
 catch(error){notify(memberError(error));}finally{busy=false;}
}
async function deleteMember(form){
 if(role!=='admin'||!memberDeletion?.deletable)throw Error('member_admin_only');
 const email=String(new FormData(form).get('confirm_email')||'');
 if(!matchingEmail(email,memberDeletion.email))throw Error('member_email_mismatch');
 const result=checkResult(await db.rpc('delete_empty_site_member',{p_user_id:memberDeletion.id,p_email:email.trim(),p_revision:memberDeletion.revision}));
 if(result?.deleted!==true)throw Error('member_changed');
 memberDeletion=null;document.querySelector('#dialog').close();await refresh();await render();notify('多余空账号已删除，其他账号与资料未受影响。');
}
function footer(){return '<footer class="site-foot"><div>何华清 · 古中医阴阳五行舌<br>用于学习与状态观察，不作为诊断或疗效证明。</div><span><a href="../../#home">完整首页</a> · <a href="../../#zhongyi">古中医栏目</a> · <a href="../../books/shenti-shiheng/">免费电子书</a> · <a href="#/privacy">记录与隐私说明</a> V1</span></footer>';}
function welcome(){return '<div class="wrap"><header class="site-head">'+brand+'<a class="text-btn" href="#/auth">登录 / 注册 ↗</a></header>'+browserHint()+'<main class="lead"><section><div class="eyebrow">OBSERVE · RECORD · FOLLOW UP</div><h1>每一次观察，<br>都值得认真留存。</h1><p>一人一档，持续记录。<br>学员用手机建档、上传照片、跟进回访；<br>老师在同一处看见完整的服务过程。</p><div class="actions"><button class="btn" data-action="start">'+icon('plus')+(live()?'登录 / 注册':'体验建档')+'</button></div><p class="small mt">'+(live()?'每人独立注册，档案与照片按权限保存。':'公开体验版 · 无需登录 · 刷新后体验记录不保留')+'</p></section><div class="hero-visual"><div class="sample"><div class="row between"><div class="row"><div class="avatar">'+icon('folder')+'</div><div><h3>一份观察档案</h3><small class="muted">手机记录 · 随时复看</small></div></div><span class="badge gold">21 天</span></div><div class="steps">'+STAGES.map((n,i)=>'<div class="step-node '+(i<3?'done':'')+'"><span>'+(i<3?'✓':n)+'</span>第'+n+'天</div>').join('')+'</div>'+trend([{status:'submitted',actual_date:'2026-10-01',data:{ratings:{spirit:3,sleep:2,appetite:3,bowel:3,mood:3}}},{status:'submitted',actual_date:'2026-10-03',data:{ratings:{spirit:3,sleep:3,appetite:4,bowel:3,mood:4}}},{status:'submitted',actual_date:'2026-10-07',data:{ratings:{spirit:4,sleep:3,appetite:3,bowel:4,mood:4}}}])+'<footer>界面示例 · 虚构数据，仅展示记录方式</footer></div></div></main><section class="feature-strip"><div><b>01</b><section><h3>扫码，建立一份档案</h3><p>本人或服务对象，基本信息填写一次。</p></section></div><div><b>02</b><section><h3>拍照，补充每次观察</h3><p>照片、体感和回访，沿时间保存。</p></section></div><div><b>03</b><section><h3>汇总，看见服务过程</h3><p>老师查看记录，筛选导出授权案例。</p></section></div></section>'+footer()+'</div>';}
function shell(html,active='home'){
 const manager=isTeacher(),name=demo?'演示学员':profile.display_name||'学员';
 const nav=manager?[['home','/home','home','工作台'],['records','/records','folder','全部档案'],['students','/students','user','学员列表'],['due','/due','clock','待跟进'],['comparisons','/comparisons','chart','连续观察对照'],['library','/library','book','教学案例'],['collect','/collect','chart','筛选与导出'],['account','/account','user','我的账号'],['trash','/trash','folder','回收站']]:[['home','/home','folder','我的空间'],['comparisons','/comparisons','chart','连续观察对照'],['due','/due','clock','待跟进'],['account','/account','user','我的账号'],['trash','/trash','folder','回收站']];
 nav.splice(1,0,['clients','/clients','user','我的客户'],['new','/new','plus','为新会员建档']);
 const publicLinks='<a href="./numbers/">数字性格 ↗</a><a href="../../#home">返回完整首页 ↗</a><a href="../../articles.html">阅读其他文章 ↗</a><a href="../../books/">我的著作 ↗</a>';
 return (demo?'<div class="demo-banner"><span>体验模式 · 虚构示例，编辑仅保留在当前页面，不上传</span><button data-action="exit-demo">退出体验</button></div>':'')+'<div class="app-shell"><aside class="sidebar">'+brand+'<nav>'+nav.map(([k,url,ic,l])=>'<a class="navitem '+(active===k?'active':'')+'" href="'+('#'+url)+'">'+icon(ic)+l+'</a>').join('')+'</nav><div class="sidebar-reading">'+publicLinks+'</div><div class="sidebar-bottom"><strong>'+esc(name)+'</strong><br>'+esc(manager?roleName(role):profile.class_name||'欢迎使用观察档案')+'<div class="divider"></div><a href="#/privacy">记录与隐私说明 ↗</a></div></aside><section class="workspace"><header class="app-header"><a class="mobile-brand" href="#/home">'+brand+'</a><span class="small muted desktop-only">上医健康管理服务表 / '+(manager?'管理工作台':'个人空间')+'</span><div class="row gap8"><span class="small header-name">'+esc(name)+'</span><a href="#/account" class="badge outline">'+(demo?'体验版':roleName(role))+'</a></div></header><main class="content">'+html+'<div class="mobile-reading">'+publicLinks+'</div></main></section></div><nav class="bottom-nav">'+(manager?nav.filter(([k])=>['home','new','clients','students','account'].includes(k)).map(([k,url,ic,l])=>'<a href="#'+url+'" class="'+((active===k||k==='clients'&&active==='records')?'active':'')+'">'+icon(ic)+(k==='home'?'工作台':k==='new'?'会员建档':k==='clients'?'我的客户':k==='students'?'学员':'我的')+'</a>').join(''):'<a href="#/home" class="'+(active==='home'?'active':'')+'">'+icon('folder')+'档案</a><a href="#/due" class="'+(active==='due'?'active':'')+'">'+icon('clock')+'跟进</a><a href="#/new"><span class="add">'+icon('plus')+'</span>会员建档</a><a href="#/account" class="'+(active==='account'?'active':'')+'">'+icon('user')+'我的</a>')+'</nav>';
}
async function fetchAll(table,columns='*',caseId=''){let out=[],start=0;for(;;){let query=db.from(table).select(columns);if(caseId)query=query.eq('case_id',caseId);const r=await query.range(start,start+499);const rows=checkResult(r)||[];out.push(...rows);if(rows.length<500)break;start+=500;}return out;}
async function fetchBirthLabels(rpc){
 const all=[];
 for(let from=0;;from+=200){
  const rows=checkResult(await db.rpc(rpc).range(from,from+199))||[];
  all.push(...rows);
  if(rows.length<200)return all;
 }
}
async function fetchMembersWithBirth(){
 const labelsRequest=fetchBirthLabels('list_member_birth_labels_with_age').catch(error=>{
  if(!['PGRST202','42883'].includes(error?.code))throw error;
  return fetchBirthLabels('list_member_birth_labels');
 });
 const [people,labels]=await Promise.all([
  role==='admin'?fetchAdminMembers():fetchAll('profiles','id,display_name,class_name,email,created_at'),
  labelsRequest
 ]);
 const byId=new Map(labels.map(row=>[row.id,row]));
 return people.map(person=>({...person,birth_labels:byId.get(person.id)||null}));
}
async function refresh(){if(demo||!user)return;const userId=user.id;const result=await Promise.all([fetchAll('cases'),fetchAll('observations'),fetchAll('photos'),staff?fetchAll('teacher_reviews'):Promise.resolve([]),staff?fetchMembersWithBirth():Promise.resolve([]),fetchAll('case_service_progress')]);if(user?.id!==userId)return;[cases,obs,photos,reviews,members]=result;const progress=new Map(result[5].map(p=>[p.case_id,p]));cases.forEach(c=>{c.progress=progress.get(c.id)||null;});archivedCases=cases.filter(c=>c.deleted_at);cases=cases.filter(c=>!c.deleted_at);cases.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));loaded=true;}
function canManageRecord(c){return Boolean(c&&(demo||c.owner_id===user?.id||role==='admin'));}
function recordListTools(collection=false){return '<div class="section-head records-toolbar"><div><h2>'+(collection?'档案目录':'我的档案')+'</h2>'+(collection?'<small class="muted" id="collect-count"></small>':'')+'</div><a class="btn tiny secondary" href="#/trash">回收站'+(archivedCases.length?'（'+archivedCases.length+'）':'')+'</a></div><p class="small muted record-delete-hint">误填或测试档案可直接删除，误删可到回收站恢复。</p>';}
function recordSteps(activity){
 const descriptions=activity.stages.map(item=>{
  const status=item.status==='submitted'?'已提交':item.status==='draft'?'草稿待提交':item.photoCount?'已存照片':'待记录';
  return stageName(item.stage)+' '+status+(item.photoCount?'，照片 '+item.photoCount+' 张':'');
 });
 return '<div class="record-steps" role="img" aria-label="'+esc(descriptions.join('；'))+'">'+activity.stages.map((item,index)=>'<i class="'+(item.status==='submitted'?'done':item.status==='draft'||item.photoCount?'has-content':'')+'" title="'+esc(descriptions[index])+'"></i>').join('')+'</div><p class="record-activity">'+caseActivityText(activity).split(' · ').map(label=>'<span>'+esc(label)+'</span>').join(' ')+'</p>';
}
function recordRow(c){const items=obs.filter(o=>o.case_id===c.id),next=nextFollow(c,items);
 const age=birthBadges({age_years:ageFromBirthDate(c.birth_date)})||'<span class="list-age-unavailable">生日待补填</span>';
 return '<article class="record-card"><a class="record" href="#/case/'+esc(c.id)+'"><div class="record-avatar">'+esc(c.name.slice(0,1))+'</div><div class="grow"><h3>'+esc(c.name)+' '+age+' <span class="badge outline">'+(c.kind==='self'?'本人':'服务对象')+'</span></h3>'+birthSummary(c.birth_date,{compact:true})+'<p>'+esc(c.code)+' · '+esc(c.class_name||'未填班级')+'</p>'+recordSteps(caseStageActivity(c,items,photos))+'</div><div class="record-meta">'+(next?'<span class="badge '+(next.date<=today()?'gold':'outline')+'">'+(next.state==='paused'?'暂停·联系':next.state==='not_started'?'未开始·联系':next.continuing?'后续约定':next.date<=today()?'待跟进':'下次')+' '+dateText(next.date.slice(5))+'</span>':'<span class="badge">本阶段已记录</span>')+'<span>建档 '+dateText(c.created_on)+'</span></div><span class="arrow">›</span></a>'+(canManageRecord(c)?'<div class="record-actions"><small>建档人：'+esc(c.partner_name||'未填写')+'</small><button type="button" class="btn tiny danger-outline" data-delete-case="'+esc(c.id)+'" aria-label="删除档案：'+esc(c.name)+'">删除档案</button></div>':'')+'</article>';}
function dashboard(due=false){if(isTeacher()&&!due)return shell(managementHome({summary:summarize({cases,observations:obs,photos,reviews,members,userId:user?.id}),cases,profile,role,personalCount:ownCases().length},recordRow,icon));const dueCases=cases.filter(c=>{const n=nextFollow(c,obs);return n&&n.date<=today();});const days=cases.reduce((n,c)=>n+obs.filter(o=>o.case_id===c.id&&o.status==='submitted').length,0);return shell('<div class="page-heading"><div><div class="eyebrow">健康观察记录</div><h1>'+(due?'今天，继续跟进':isTeacher()?'档案总览':'我的空间')+'</h1><p>'+(due?'按已约定日期或阶段计划整理。':'为自己，也为每一位服务对象。')+'</p></div><a href="#/new" class="btn">'+icon('plus')+'为新会员建档</a></div><div class="stats"><div class="stat"><span>正在记录的档案</span><strong>'+cases.length+'</strong><small>份</small></div><div class="stat"><span>待跟进</span><strong>'+dueCases.length+'</strong><small>份</small></div><div class="stat"><span>已提交观察</span><strong>'+days+'</strong><small>次</small></div></div><a class="comparison-entry" href="#/comparisons"><div><span>照片 · 评分 · 连续跟进</span><strong>连续观察对照</strong><p>每份档案自动整理，随时回看每一次变化。</p></div><b>查看对照 ↗</b></a>'+recordListTools()+'<div class="filters"><input class="input" id="search" type="search" placeholder="搜索称呼、档案编号、班级" aria-label="搜索档案"><select id="kind-filter" aria-label="档案类型"><option value="">全部类型</option><option value="client">服务对象</option><option value="self">本人记录</option></select></div><div id="record-list" class="record-list" data-due="'+due+'">'+(due?dueCases:cases).map(recordRow).join('')+(!cases.length?'<div class="empty"><h3>开始第一份记录</h3><p>先建档，再按时间补充观察与照片。</p><a class="btn" href="#/new">新建档案</a></div>':'')+'</div>'+(!dueCases.length&&due?'<p class="empty">暂时没有到期的跟进记录。</p>':''),due?'due':'home');}
function newForm(c=null){
 const identity=caseIdentity(c||{}),b=c?.baseline||{},first=obs.find(o=>o.case_id===c?.id&&o.stage==='d1'),ratings=first?.data?.ratings||b.initialRatings||{};
 const age=ageFromBirthDate(identity.birth_date);
 const birthAndAge='<div>'+birthDateField(identity.birth_date)+'<div class="case-age-field"><label class="label" for="case-age">年龄（周岁）</label><output id="case-age" for="birth-year birth-month birth-day" data-case-age>'+(age??'—')+'</output></div></div>';
 return '<a class="back" href="#'+(c?'/case/'+c.id:'/home')+'">← 返回档案</a><div class="page-heading"><div><h1>'+(c?'客户基础信息':'首次建档')+'</h1><p>A-01 · 首次基础记录</p></div></div><form id="case-form" class="panel paper-intake" data-id="'+esc(c?.id||'')+'"><div id="form-error"></div><div id="matching-case-hint" class="notice matching-case" hidden></div><div class="grid2">'+select('为谁记录','kind',c?.kind||'client',[['client','为他人记录'],['self','为自己记录']])+field('班级 / 期次','class_name',c?.class_name||profile.class_name||'','text','maxlength="80"')+'</div><section class="paper-section"><h2>一、客户基础信息</h2><div class="grid2">'+field('客户姓名 / 称呼 <span class="gold">*</span>','name',c?.name||'','text','required maxlength="40" placeholder="可使用化名"')+field('建档日期','created_on',c?.created_on||today(),'date','required')+birthAndAge+field('手机号 <span class="gold">必填</span>','phone',identity.phone,'tel','required maxlength="24" autocomplete="tel" inputmode="tel" placeholder="大陆 11 位手机号；其他地区加国际区号"')+'<details class="case-birth-preview"><summary>查看出生日期与星座</summary>'+birthSummary(identity.birth_date)+'</details>'+field('其他联系方式（选填）','contact',c?.contact||'','text','maxlength="80" placeholder="微信或其他联系方式"')+field('服务伙伴','partner_name',c?.partner_name||profile.display_name||'','text','maxlength="60"')+field('服务编号','service_code',c?.code||'保存后自动生成','text','readonly aria-readonly="true"')+'</div>'+choiceGroup('建档记录 <span class="gold">*</span>','consent_record',c?.consent_record?'同意':'',['同意','不同意'],{required:true})+'<p class="small muted">先征得本人同意，再建立记录。负责学员及何华清老师可查看，用于本次观察与跟进。</p></section><section class="paper-section"><h2>二、服务需求与当前困扰</h2><div class="field"><span class="label">本次服务需求（可多选）</span>'+checks('needs',b.needs,NEEDS)+'</div><div class="field"><span class="label">当下体感（可多选）</span>'+checks('feelings',b.feelings,FEELINGS)+'</div>'+area('最希望改善','wish',b.wish)+area('目前具体怎样','detail',b.detail)+'</section><section class="paper-section"><h2>三、使用前了解</h2>'+area('过敏情况','allergy',b.allergy)+area('在用药 / 产品','meds',b.meds)+choiceGroup('拍摄与保存','consent_photo',c?(c.consent_photo?'同意':'不同意'):'',['同意','不同意'])+'<p class="small muted">不同意照片保存时，仍可填写文字记录。</p></section><section class="paper-section"><h2>四、首次体感评分</h2><p class="scale-label">请本人评分：1 差 · 2 偏差 · 3 一般 · 4 较好 · 5 很好</p>'+(first?'<fieldset disabled class="paper-readonly-ratings">':'')+ratingControls(ratings)+(first?'</fieldset><a class="text-btn" href="#/case/'+esc(c.id)+'?stage=d1">前往首次观察修改评分 ↗</a>':'')+area('客户补充','extra',b.extra)+'</section><section class="paper-section consent-extra"><h3>教学案例授权（选填）</h3>'+checkbox('consent_teaching','同意将去除个人标识的记录用于教学案例。',c?.consent_teaching,'独立选择，默认不同意；之后可以在档案中撤回。')+'</section><p class="small muted">用于学习与状态观察，不作为诊断或疗效证明。</p><button class="btn full" type="submit">'+(c?'保存基本信息':'保存并进入首次观察')+'</button></form>';
}
async function saveCase(form){const f=new FormData(form),id=form.dataset.id,c=cases.find(x=>x.id===id);if(f.get('consent_record')!=='同意')throw Error('请先征得本人同意，并勾选建档授权。');const identity=normalizeIdentity({birth_date:f.get('birth_date'),phone:f.get('phone')});const payload={...identity,kind:f.get('kind'),name:String(f.get('name')).trim(),created_on:f.get('created_on'),class_name:f.get('class_name'),partner_name:f.get('partner_name'),contact:f.get('contact'),consent_record:true,consent_photo:f.get('consent_photo')==='同意',consent_teaching:f.has('consent_teaching'),baseline:{...c?.baseline,initialRatings:c&&obs.some(o=>o.case_id===c.id&&o.stage==='d1')?(c.baseline?.initialRatings||{}):Object.fromEntries(ITEMS.map(([k])=>[k,Number(f.get('rating_'+k))||null])),needs:f.getAll('needs'),feelings:f.getAll('feelings'),wish:f.get('wish'),detail:f.get('detail'),allergy:f.get('allergy'),meds:f.get('meds'),extra:f.get('extra')}};if(!payload.name)throw Error('请填写姓名或称呼。');if(demo){if(c)Object.assign(c,payload,{version:c.version+1});else{payload.id='demo-'+requestUUID();payload.code='A'+Math.random().toString(36).slice(2,9).toUpperCase();payload.owner_id='demo';payload.version=1;cases.unshift(payload);}}else if(c){checkResult(await db.from('cases').update({...payload,version:c.version+1}).eq('id',id).eq('version',c.version).select().single());}else{Object.assign(payload,checkResult(await db.from('cases').insert(payload).select().single()));}dirty=false;await refresh();notify(demo?'体验档案已保留在当前页面':'档案已保存到云端');activeStage='d1';go('/case/'+(id||payload.id));}
function ratingControls(r={}){return '<div class="ratings">'+ITEMS.map(([k,l])=>'<div class="rating-row"><span>'+l+'</span><div class="rating-buttons" role="group" aria-label="'+l+'评分">'+[1,2,3,4,5,0].map(n=>'<button type="button" data-rating="'+k+'" data-value="'+n+'" class="'+((r[k]||0)===n?'selected':'')+'" aria-pressed="'+((r[k]||0)===n)+'">'+(n||'未评')+'</button>').join('')+'<input type="hidden" name="rating_'+k+'" value="'+(r[k]||0)+'"></div></div>').join('')+'</div>';}
function productsHTML(rows=[],scope='actual'){
 const prefix=scope==='plan'?'plan_product_':'product_',plan=scope==='plan';
 return '<div id="'+(plan?'plan-product-rows':'product-rows')+'">'+rows.map((source,i)=>{
 const p=productWithPlanTime(source,scope),fixed=plan&&productTemplate(p.name),legacy=fixed&&((p.time!==fixed.time)||(p.unit!==fixed.unit));
 return '<section class="product-row paper-product" data-index="'+i+'" data-product-scope="'+scope+'"><div class="paper-product-heading"><h4>'+esc(p.name)+'</h4>'+(productTemplate(p.name)?'<span class="paper-element">'+esc(productElementLabel(p))+'</span>':'')+(!fixed?'<button type="button" class="text-btn" data-remove-product="'+i+'" data-scope="'+scope+'">移除此项</button>':'')+'</div><input type="hidden" name="'+prefix+'index" value="'+i+'"><input type="hidden" name="'+prefix+'name_'+i+'" value="'+esc(p.name)+'">'+choiceGroup(plan?'使用安排':'使用状态',prefix+'status_'+i,p.useStatus||(p.unused?(plan?'不安排':'未使用'):(plan?'待填写':'待核对')),plan?['待填写','拟用',['不安排','未用']]:['待核对','已使用','未使用','已填写'])+'<div class="record-select-grid">'+field(plan?'服用时间':'实际服用时间',prefix+'time_'+i,p.time||'','text',fixed?'readonly aria-readonly="true"':'maxlength="80"')+field('单位',prefix+'unit_'+i,p.unit||'','text',fixed?'readonly aria-readonly="true"':'maxlength="20" placeholder="例如：袋、粒"')+field('每次量',prefix+'amount_'+i,p.amount||'','text','maxlength="30"')+field('每日次数',prefix+'times_'+i,p.perDay||'','text','maxlength="20"')+'</div>'+(legacy?'<p class="small muted">此项保留历史填写：'+esc(p.time)+' / '+esc(p.unit)+'。原表固定值为 '+esc(fixed.time)+' / '+esc(fixed.unit)+'。</p>':'')+'<details class="product-note"><summary>补充说明</summary>'+area('本项说明',prefix+'note_'+i,p.note,'按实际安排填写。')+'</details></section>';
 }).join('')+'</div>';
}
function readProducts(form,scope='actual',snapshot){return readProductRows(snapshot||new FormData(form),scope);}
function stageForm(c,stage){
 const original=obs.find(x=>x.case_id===c.id&&x.stage===stage),self=projectedSelf(original,selfResponses,c.id,stage);let o=original;if(self)o={...o,actual_date:o?.actual_date||self.actual_date,data:{...o?.data,ratings:self.ratings,quote:self.quote,clientSelfId:self.id}};if(stage==='d1'&&!o?.data?.ratings&&c.baseline?.initialRatings)o={...o,data:{...o?.data,ratings:{...c.baseline.initialRatings}}};
 const earlier=obs.filter(x=>x.case_id===c.id&&x.status==='submitted'&&Number(x.stage.slice(1))<Number(stage.slice(1))).sort((a,b)=>Number(b.stage.slice(1))-Number(a.stage.slice(1)))[0];
 if(!o?.data?.actions&&earlier?.data?.actions){o={...o,data:{...o?.data,actions:Object.fromEntries(FOUR_ACTIONS.map(([k])=>[k,{...earlier.data.actions[k],status:'未核对',feedback:''}]))}};}
 draftProducts=o?.data?.products||[];
 draftPlanProducts=paperPlanRows(o?.data?.plan?.products||[]);
 o={...o,data:{...o?.data,plan:{...o?.data?.plan,products:draftPlanProducts}}};
 const isOwner=demo||c.owner_id===user?.id;
 return renderStageForm(c,original?o:{...o,id:null},stage,{profile,demo,isOwner,observations:obs,photoNumbers:photos.filter(p=>p.case_id===c.id&&p.stage===stage).map(p=>p.file_no),uploadHTML:photoBatchMarkup(c,stage),photosHTML:photos.filter(p=>p.case_id===c.id&&p.stage===stage).map(photoThumb).join('')},{field,area,select,checkbox,ratingControls:self?()=>selfRatings(self.ratings):ratingControls,productsHTML,icon}).replace('<form id="observation-form"','<form data-client-self-id="'+esc(self?.id||'')+'" id="observation-form"');
}
function photoThumb(p){
 const alt=stageName(p.stage)+' '+p.taken_on;
 return '<div class="photo-thumb">'+savedPhotoPreview(p,photoURL,alt,{lazy:false})+'<span class="photo-saved">✓ '+(demo?'已添加':'已保存')+'</span><small>'+dateText(p.taken_on)+' · '+esc(p.file_no)+'</small>'+((demo||currentCase?.owner_id===user?.id)?'<button type="button" data-delete-photo="'+esc(p.id)+'" aria-label="删除此照片">×</button>':'')+'</div>';
}
async function signPhotos(list){
 if(demo||!user)return;
 const paths=[...new Set(list.map(photo=>photo.storage_path).filter(Boolean))];
 if(!paths.length)return;
 const client=db,viewer=user.id;
 const result=await client.storage.from('case-photos').createSignedUrls(paths,120);
 if(user?.id!==viewer||db!==client||demo)return;
 paths.forEach(path=>signed.delete(path));
 checkResult(result)?.forEach(item=>{if(item.signedUrl&&paths.includes(item.path))signed.set(item.path,item.signedUrl);});
}
function photoURL(p){
 if(!p)return '';
 const preview=photoBatches.get(p.case_id+':'+p.stage)?.items.find(item=>item.status==='success'&&item.saved?.id===p.id)?.preview;
 return p.url||signed.get(p.storage_path)||preview||'';
}
root.addEventListener('error',event=>{
 const image=event.target,container=image instanceof HTMLImageElement?image.closest('.saved-photo-preview'):null;
 if(container)container.innerHTML=photoPreviewBody('',container.dataset.photoAlt,{retry:container.hasAttribute('data-preview-retry')});
},true);
async function retryPhotoPreview(button){
 const container=button.closest('.saved-photo-preview'),viewer=user?.id,caseId=currentCase?.id;
 const photo=photos.find(item=>item.id===container?.dataset.savedPhoto&&item.case_id===caseId);
 if(!photo||button.disabled)return;
 button.disabled=true;
 button.textContent='正在载入…';
 try{
  await signPhotos([photo]);
  if(!container.isConnected||user?.id!==viewer||currentCase?.id!==caseId)return;
  const url=photoURL(photo);
  if(url){
   for(const slot of root.querySelectorAll('.saved-photo-preview[data-preview-retry]')){
    if(slot.dataset.savedPhoto===photo.id&&!slot.querySelector('img'))slot.innerHTML=photoPreviewBody(url,slot.dataset.photoAlt,{lazy:false});
   }
   return;
  }
 }catch{}
 if(button.isConnected){button.disabled=false;button.textContent='重试预览';notify('照片有保存记录，预览暂未载入。');}
}
function photoBatchMarkup(c,stage){
 const record=obs.find(item=>item.case_id===c.id&&item.stage===stage);
 const receiptHref=record?.id?'#/case/'+encodeURIComponent(c.id)+'/compare?visit='+encodeURIComponent(record.id):'';
 return renderUploadFeedback(photoBatches.get(photoBatchKey(c,stage)),{demo,receiptHref});
}
function updateCaseActivity(){
 if(!currentCase)return;
 const status=root.querySelector('#case-activity-status'),rail=root.querySelector('.case-stage-rail');
 if(status)status.textContent=caseActivityText(caseStageActivity(currentCase,obs,photos));
 if(rail)rail.innerHTML=stageButtons(currentCase,obs,selfResponses,activeStage,photos);
}
function comparison(c){return comparisonDetail(c,caseTimeline(c.id,obs,photos),photoURL,trend(obs.filter(o=>o.case_id===c.id)),new URLSearchParams(cleanHash().split('?')[1]||'').get('visit'));}
function comparisonsPage(){return shell('<div class="page-heading"><div><div class="eyebrow">OBSERVE · COMPARE · FOLLOW UP</div><h1>连续观察对照</h1><p>每份档案的照片、评分与跟进，集中在这里。</p></div><a class="btn secondary" href="#/home">返回档案</a></div><label class="comparison-search">查找档案<input type="search" class="input" id="comparison-search" placeholder="姓名、编号、班级或记录人"></label><div class="comparison-card-grid">'+comparisonCards(cases,obs,photos,photoURL)+'</div><div id="comparison-empty" class="empty" '+(cases.length?'hidden':'')+'><h3>'+(cases.length?'没有匹配的档案':'先建立一份档案')+'</h3><p>'+(cases.length?'试试姓名或档案编号。':'每次保存观察后，照片与评分自动形成对照。')+'</p>'+(!cases.length?'<a class="btn" href="#/new">为新会员建档</a>':'')+'</div>','comparisons');}
function filterComparisons(){const q=document.querySelector('#comparison-search').value.trim().toLowerCase();let count=0;document.querySelectorAll('[data-comparison-search]').forEach(card=>{card.hidden=!card.dataset.comparisonSearch.includes(q);if(!card.hidden)count++;});document.querySelector('#comparison-empty').hidden=count>0;}
function updateObservationProgress(){syncFormDirty();const form=document.querySelector('#observation-form');if(!form)return;const count=[...form.querySelectorAll('input[name^="rating_"]')].filter(i=>Number(i.value)>0).length;const progress=document.querySelector('#observation-progress');if(progress)progress.textContent='已评 '+count+' / 5 项';updateSaveState();}
function matchingCaseHint(){const form=document.querySelector('#case-form'),hint=document.querySelector('#matching-case-hint');if(!form||!hint)return;const name=form.elements.name.value.trim();const matches=name?cases.filter(c=>c.id!==form.dataset.id&&c.name.trim()===name&&(demo||c.owner_id===user?.id)):[];hint.innerHTML=matches.length?'<strong>您已有同名称档案</strong><p>如果是同一位服务对象，请继续原档案，保留连续记录；同名的不同人仍可分别建档。</p>'+matches.map(c=>'<a href="#/case/'+esc(c.id)+'">'+esc(c.code)+' · '+esc(c.name)+' · '+dateText(c.created_on)+' ↗</a>').join(''):'';hint.hidden=!matches.length;}
function centerActiveStage(){const rail=document.querySelector('.case-stage-rail'),selected=rail?.querySelector('.active');if(rail&&selected){const r=rail.getBoundingClientRect(),b=selected.getBoundingClientRect();rail.scrollLeft+=b.left-r.left-(rail.clientWidth-b.width)/2;}}
window.addEventListener('resize',centerActiveStage);
function caseHeading(c,items,owned){
 const age=ageFromBirthDate(c.birth_date);
 const ageMeta=age===null?'':'<span class="case-record-age">年龄 <span>'+age+' 周岁</span></span>';
 const actions=(!demo?'<a class="btn tiny secondary" href="./numbers/#case/'+encodeURIComponent(c.id)+'">数字性格</a>':'')+(owned?journeyEntry(c):'')+((owned||role==='admin')?'<details class="case-more"><summary aria-label="档案更多操作">更多 ···</summary><div class="case-more-menu"><button class="btn tiny danger-outline case-delete" data-action="archive-case">删除档案</button></div></details>':'');
 return '<div class="case-topbar"><a class="back case-back" href="#'+(recordListRoute||(owned?'/clients':'/records'))+'">← '+(recordListRoute.startsWith('/member/')?'返回学员后台':'返回档案')+'</a><div class="case-top-actions">'+actions+'</div></div><div class="page-heading case-details-heading"><div class="case-heading-main"><div class="case-title-row"><h1>'+esc(c.name)+'</h1><span class="badge outline">'+(c.kind==='self'?'本人记录':'服务对象')+'</span></div><div class="kicker">'+esc(c.code)+' · '+esc(c.class_name||'观察档案')+'</div><p class="record-activity" id="case-activity-status" role="status">'+esc(caseActivityText(caseStageActivity(c,items,photos)))+'</p><div class="case-record-meta"><span>建档 <time>'+dateText(c.created_on)+'</time></span><span>记录人 <span>'+esc(c.partner_name||'未填写')+'</span></span>'+ageMeta+'</div>'+(c.birth_date?'<details class="case-birth-preview case-identity-preview"><summary>出生日期与星座</summary><div class="case-identity-tags">'+birthSummary(c.birth_date,{compact:true})+'</div></details>':'')+'</div></div>';
}
function detailsPage(c,tab='record'){const items=obs.filter(o=>o.case_id===c.id),owned=demo||c.owner_id===user?.id;return shell(caseHeading(c,items,owned)+'<div class="tabs case-tabs" style="--case-tab-count:'+(isTeacher()?6:5)+'">'+[['record','观察记录'],['self','客户自评'],['plans','产品方案'],['compare','连续对照'],['info','基本信息'],...(isTeacher()?[['review','老师整理']]:[])].map(([k,l])=>'<button data-tab="'+k+'" class="'+(k===tab?'active':'')+'">'+l+'</button>').join('')+'</div>'+(tab==='record'?progressPanel(c,obs,{owner:owned})+stageRail(c,obs,selfResponses,activeStage,photos)+selfPanel(c,activeStage,selfResponses,obs,{owner:owned,error:selfLoadError,demo})+stageForm(c,activeStage):tab==='self'?progressPanel(c,obs,{owner:owned})+selfOverview(c,selfResponses,obs,{owner:owned,error:selfLoadError}):tab==='plans'?plansPage(c,obs,{selected:new URLSearchParams(cleanHash().split('?')[1]||'').get('version'),stage:new URLSearchParams(cleanHash().split('?')[1]||'').get('stage'),owned,demo}):tab==='compare'?progressPanel(c,obs,{owner:owned})+comparison(c):tab==='review'?reviewForm(c):'<div class="panel"><h2>档案与授权</h2><dl><dt class="small muted">建档类型</dt><dd>'+esc(c.kind==='self'?'本人记录':'服务对象')+'</dd><dt class="small muted">出生年月日</dt><dd>'+(c.birth_date?birthSummary(c.birth_date):'待补填')+'</dd><dt class="small muted">手机号</dt><dd>'+esc(caseIdentity(c).phone||'待补填')+'</dd><dt class="small muted">其他联系方式</dt><dd>'+esc(c.contact||'未填写')+'</dd><dt class="small muted">拍照保存</dt><dd>'+(c.consent_photo?'已同意':'未同意')+'</dd><dt class="small muted">匿名教学案例</dt><dd>'+(c.consent_teaching?'已同意，可撤回':'未同意')+'</dd></dl><div class="divider"></div><h3>首次需求</h3><p class="small">'+esc((c.baseline?.needs||[]).join('、')||'未填写')+'</p><p class="small">'+esc(c.baseline?.wish||'未填写')+'</p><dl class="baseline-details">'+[['当下体感',(c.baseline?.feelings||[]).join('、')],['目前具体怎样',c.baseline?.detail],['过敏情况',c.baseline?.allergy],['在用药 / 产品',c.baseline?.meds],['本人补充',c.baseline?.extra]].map(([label,value])=>'<dt>'+label+'</dt><dd>'+esc(value||'未填写')+'</dd>').join('')+'</dl><p class="small muted">学生只可查看自己负责的档案，老师可查看本人已同意采集的记录。</p>'+(owned?'<div class="stack mt"><a class="btn secondary" href="#/edit/'+esc(c.id)+'">编辑信息与授权</a>'+(c.consent_teaching?'<button class="text-btn" data-action="revoke">撤回教学案例授权</button>':'')+'<button class="btn tiny danger-outline case-delete" data-action="archive-case">删除档案</button></div>':'')+'</div>'),recordListRoute?.startsWith('/clients')||owned?'clients':'records');}
function reviewForm(c){const r=reviews.find(x=>x.case_id===c.id)||{};return '<form id="review-form" class="panel"><div id="form-error"></div><h2>保留原记录，单独做整理</h2><p class="small muted">老师评语不会改写学生的观察原文。</p>'+select('整理状态','org_status',r.org_status||'pending',[['pending','待整理'],['organized','已整理']])+field('主题标签（以逗号分隔）','tags',(r.tags||[]).join('，'),'text','maxlength="200" placeholder="例如：作息记录、连续观察"')+area('老师评语','comment',r.comment)+'<button class="btn" type="submit">保存整理</button><div class="divider"></div>'+(canTeach(c)?'<h3>已获独立教学授权</h3><p class="small muted">导出的案例默认只含匿名编号、日期与五项评分，不含姓名、电话、原始自由文本或照片。</p><button class="btn secondary" type="button" data-action="case-export">生成匿名案例页</button>':'<div class="well"><p>本人尚未同意教学案例使用。本档案不会纳入教学案例库。</p></div>')+'</form>';}
function collection(library=false){
 if(!isTeacher())return shell(errBox('此页面仅供管理账号使用。'));
 const classes=[...new Set(cases.map(c=>c.class_name).filter(Boolean))];
 const owners=[...new Set([...members.map(m=>m.id),...cases.map(c=>c.owner_id),new URLSearchParams(cleanHash().split('?')[1]||'').get('owner')].filter(Boolean))].map(id=>({id,name:members.find(m=>m.id===id)?.display_name||cases.find(c=>c.owner_id===id)?.partner_name||'未填写姓名'}));
 const parameters=new URLSearchParams(cleanHash().split('?')[1]||''),owner=parameters.get('owner')||'',consent=library?'yes':parameters.get('consent')||'';
 return shell('<div class="page-heading"><div><div class="eyebrow">'+(library?'TEACHING LIBRARY':'RECORD COLLECTION')+'</div><h1>'+(library?'教学案例库':'全部档案与汇总')+'</h1><p>'+(library?'仅展示已同意匿名教学的档案，可进入记录整理笔记。':'按学员、班级与日期查看，导出当前筛选结果。')+'</p></div><button class="btn secondary" data-action="csv-export">'+icon('export')+'导出</button></div>'+(library?'':archiveSwitch('all'))+'<div class="filters"><input class="input" id="collect-search" aria-label="搜索全部档案" placeholder="搜索姓名、编号"><select id="class-filter" aria-label="按班级筛选"><option value="">全部班级</option>'+classes.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select><select id="student-filter" aria-label="按记录学员筛选"><option value="">全部学员</option>'+owners.map(m=>'<option value="'+esc(m.id)+'"'+(owner===m.id?' selected':'')+'>'+esc(m.name)+(m.id===user?.id?'（我）':'')+'</option>').join('')+'</select><select id="consent-filter" aria-label="案例授权筛选" '+(library?'disabled':'')+'>'+[['','全部记录'],['yes','已授权教学案例'],['no','未授权教学案例'],['delete','删除申请']].map(([v,l])=>'<option value="'+v+'"'+(v===consent?' selected':'')+'>'+l+'</option>').join('')+'</select><select id="stage-filter" aria-label="观察阶段筛选"><option value="">全部阶段</option>'+[...new Set(cases.flatMap(c=>stageDays(c,obs)))].sort((a,b)=>a-b).map(n=>'<option value="d'+n+'">已提交第'+n+'天</option>').join('')+'</select></div><div class="grid2"><div class="field"><label class="label" for="date-start">建档起始日期</label><input class="input" type="date" id="date-start"></div><div class="field"><label class="label" for="date-end">建档截止日期</label><input class="input" type="date" id="date-end"></div></div>'+recordListTools(true)+'<div id="collect-list" class="record-list"></div>',library?'library':cleanHash().startsWith('/records')?'records':'collect');
}
function studentsPage(){
 if(!isTeacher())return shell(errBox('此页面仅供管理账号使用。'));
 return shell('<div class="toplinks"><a class="btn secondary tiny" href="./numbers/#permissions">数字性格权限</a></div><div class="page-heading"><div><div class="eyebrow">PEOPLE & RECORDS</div><h1>学员列表</h1><p>'+(role==='admin'?'点击学员姓名，查看个人资料、数字性格与服务档案。':'查看注册学员与建档情况，进入每个人的档案。')+'</p></div><button class="btn secondary" data-action="refresh-workspace">刷新</button></div><div class="filters"><input id="member-search" class="input" type="search" aria-label="搜索学员" placeholder="搜索姓名、邮箱、班级"><select id="member-state" aria-label="筛选学员"><option value="">全部学员</option><option value="active">已建立档案</option><option value="empty">尚未建档</option><option value="duplicate">有同名账号</option>'+(role==='admin'?'<option value="not-signed-in">尚未登录</option>':'')+'</select></div><p id="member-count" class="small muted"></p><div id="member-list" class="member-grid"></div>','students');
}
function filterMembers(){
 const q=(document.querySelector('#member-search')?.value||'').trim().toLowerCase(),state=document.querySelector('#member-state')?.value||'',duplicates=duplicateNames(members);
 const list=memberSummaries(members,cases,obs,photos,user?.id).filter(m=>(!q||[m.display_name,m.email,m.class_name].join(' ').toLowerCase().includes(q))&&(state!=='active'||m.recordCount>0)&&(state!=='empty'||!m.recordCount)&&(state!=='duplicate'||duplicates.has((m.display_name||'').trim()))&&(state!=='not-signed-in'||!m.last_sign_in_at));
 document.querySelector('#member-count').textContent=list.length+' 位学员（不含您本人）';
 document.querySelector('#member-list').innerHTML=list.length?list.map(m=>memberCard(m,{admin:role==='admin'&&!demo,duplicate:duplicates.has((m.display_name||'').trim())})).join(''):'<div class="empty panel"><h3>暂无符合条件的学员</h3><p>新会员注册后，会在这里显示。</p></div>';
}
function filteredCollection(){const val=id=>document.getElementById(id)?.value||'';return archiveFilter(cases,obs,{query:val('collect-search'),className:val('class-filter'),ownerId:val('student-filter'),start:val('date-start'),end:val('date-end'),consent:val('consent-filter'),stage:val('stage-filter')});}
function browserHint(){return '<aside class="browser-hint" aria-label="浏览器使用建议"><div><strong>建议在手机浏览器中打开</strong><span>登录与照片上传更顺畅。</span></div><button type="button" class="text-btn" data-action="copy-browser-link">复制网址</button></aside>';}
async function copyBrowserLink(button){
 const url=new URL('./#/auth',import.meta.url).href;
 try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(url);button.textContent='已复制';notify('网址已复制，请粘贴到手机浏览器打开。');setTimeout(()=>{if(button.isConnected)button.textContent='复制网址';},2500);}
 catch{dialog('<h2>在手机浏览器中打开</h2><p class="small muted">长按下方网址复制，再粘贴到手机浏览器地址栏。</p><label class="label" for="browser-entry-url">登录网址</label><input class="input" id="browser-entry-url" readonly value="'+url+'"><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">关闭</button></div>');}
}
function authPage(){
  const signup=authMode==='signup',forgot=authMode==='forgot',setup=authMode==='setup';
  const title=setup?'设置您的登录密码':forgot?'找回登录密码':signup?'注册全站账号':'登录健康档案';
  const passwordAttributes=setup||signup?'required minlength="6" autocomplete="new-password" placeholder="至少6位，数字或字母均可"':'required autocomplete="current-password" placeholder="请输入密码"';
  const intro=signup?'网站账号与上医健康管理服务表通用。注册后直接登录，邮箱验证和详细资料可以稍后在个人页完成。':setup?'设置密码后，即可进入自己的健康档案。':forgot?'填写注册时使用的邮箱，我们会发送重设密码的邮件。':'填写邮箱和密码，继续记录。';
  const tabs=!forgot&&!setup?'<div class="auth-tabs" role="tablist" aria-label="账号入口"><button type="button" role="tab" aria-selected="'+(!signup)+'" data-auth="login">已有账号</button><button type="button" role="tab" aria-selected="'+signup+'" data-auth="signup">新用户注册</button></div>':'';
  return '<div class="wrap"><header class="site-head"><a href="#/">'+brand+'</a><a class="text-btn" href="#/">档案入口</a></header><div class="auth-shell"><div class="panel auth-panel"><h1>'+title+'</h1><p class="small muted">'+intro+'</p>'+tabs+(!live()?'<div class="notice mb">当前为公开体验版，登录注册与云端保存尚未开通。可直接体验下方两种视角，无需填写真实账号。</div>':'')+'<form id="auth-form">'+(authMessage?'<div class="notice mb">'+esc(authMessage)+'</div>':'')+'<div id="form-error"></div>'+(signup?signupFields('archive-signup'):'')+field('邮箱','email',setup?user?.email||'':'','email','required autocomplete="email" '+(setup?'readonly':'placeholder="能接收邮件的邮箱"'))+(!forgot?field(setup||signup?'设置密码':'密码','password','','password',passwordAttributes):'')+(setup||signup?field('再次输入密码','confirm_password','','password','required minlength="6" autocomplete="new-password"'):'')+'<button class="btn full" type="submit" '+(!live()?'disabled':'')+'>'+(setup?'保存密码并进入档案':forgot?'发送重设邮件':signup?'注册账号':'登录并进入档案')+'</button></form><div class="row between mt"><span class="small muted">与网站共用账号，无需重复注册。</span>'+(!signup&&!setup?'<button class="text-btn" data-auth="'+(forgot?'login':'forgot')+'">'+(forgot?'返回登录':'忘记密码')+'</button>':'')+'</div>'+(!live()?'<div class="divider"></div><div class="stack"><button class="btn secondary full" data-action="student-demo">体验学员建档与舌象上传</button></div>':'')+'<p class="small"><a href="../../account/verify/">已有验证邮件？在这里完成验证</a></p><details class="login-help"><summary>登录或上传遇到问题？</summary>'+browserHint()+'<p class="small muted">请使用注册时的邮箱。忘记密码时，可以通过邮箱重新设置。</p></details><p class="auth-reading-note">只想阅读？点顶部“返回完整首页”，无需登录。</p></div></div>'+footer()+'</div>';
}
function accountPage(){return shell('<div class="page-heading"><div><div class="eyebrow">ACCOUNT & ACCESS</div><h1>我的账号</h1><p>让每一份记录，都能找到负责的人。</p></div><a class="btn" href="#/new">'+icon('plus')+'为新会员建档</a></div>'+(!demo&&!sessionPersistence()?'<p class="notice">'+esc(temporarySessionNotice)+'</p>':'')+'<section id="aform-email-status" class="email-status" aria-label="邮箱验证"></section><form id="profile-form" data-user-id="'+esc(user?.id||'')+'" class="panel"><div id="form-error"></div>'+'<p class="profile-note">与网站账号共用，在任一入口修改都会同步。</p>'+(profile.profile_version!==2?'<p class="profile-notice">请补全真实姓名、出生年月日、手机号，并核对学习情况。</p>':'')+profileFields(profile,'archive-account')+'<p class="small muted">账号身份：'+(demo?'体验账号':roleName(role))+'<br>邮箱：'+esc(demo?'未使用真实账号':user?.email||'')+'</p><button type="submit" class="btn">保存资料</button><div class="divider"></div><h3>记录属于谁</h3><p class="small muted">学员仅可查看自己建立的档案；经本人同意后，老师统一采集和查看。教学案例授权独立设置，可以在档案中撤回。</p><div class="account-links"><a class="small" href="../../account/">网站账号与阅读设置 ↗</a><a class="small" href="#/privacy">查看记录与隐私说明 ↗</a><a class="btn secondary tiny" href="#/trash">档案回收站 ↗</a></div><div class="divider"></div><button class="btn secondary" type="button" data-action="'+(demo?'exit-demo':'logout')+'">'+(demo?'退出体验':'退出登录')+'</button></form>','account');}
function privacy(){return '<div class="wrap"><header class="site-head"><a href="#/">'+brand+'</a><a href="#/" class="text-btn">档案入口</a></header><article class="legal"><h1>记录与隐私</h1><p>本网站用于古中医阴阳五行舌课程的学习、状态观察与服务跟进。照片和评分不会自动形成诊断、用量建议或疗效结论。</p><h2>账号个人资料</h2><p>网站账号与上医健康管理服务表共用同一个账号和个人资料。注册及修改资料必须填写真实姓名、出生年月日和手机号；所在地选填，仅需省、市或地区。参加过学习的，请如实填写期数。您可在任一入口的“我的账号”中修改。姓名与学习期数供原有授权管理人员识别和跟进；出生年月日、手机号与所在地保存在本人账号资料中，不加入公开页面或匿名统计。星座用作资料参考。数字性格的完整三角形与特征仅向何华清本人及其单独开通的账号提供；被开通账号仍仅可查看原本有权访问的客户，可随时关闭授权。客户自评与分享链接不包含此功能。</p><h2>先获得同意，再建档</h2><p>学员为别人记录时，应先说明采集项目、用途与查看范围。姓名可用称呼或化名，出生年月日和手机号必填，其他联系方式选填。客户资料仅在已有授权范围内供记录与跟进使用，不会出现在客户自评链接或匿名教学导出中。不采集身份证号或家庭住址。</p><h2>谁可以进入与查看</h2><p>免费电子书无需注册。建档采用注册登录：负责记录的学员与获授权的老师可以查看对应档案，其他学员不能查看；照片使用私有存储与限时访问链接。请以当前页面显示的版本状态为准。</p><h2>本人记录页与分享</h2><p>本人记录页由负责学员征得本人同意后开启，展示确认时的服务节点记录。本人入口仅交给本人，可查看记录并管理分享；请勿把本人管理入口转发给他人。本人可逐项选择文字、评分和照片，预览后生成独立只读分享链接。拿到分享链接的人可查看与继续转发；链接可设置有效期并提前关闭。新增记录不会自动加入已分享页面，需要再次确认。手机号、生日、内部教学笔记不进入分享页；照片仅保存经过选择的预览副本，原照片仍按原权限保存。关闭分享不影响原始档案，也不能收回别人已经保存的副本。</p><h2>案例授权单独选择</h2><p>建立档案、保存照片、匿名教学案例是分开的授权。教学案例默认不同意，可以在档案中撤回。公开分享案例前仍需逐项核对照片和文字中可能识别个人的信息。</p><h2>修改与删除</h2><p>记录学员可修改本人负责的档案、撤回教学授权，并提交删除申请。老师的整理与学生原始记录分开保存。已导出到网站之外的文件需由导出者另外管理。</p><h2>当前版本状态</h2><p>'+esc(config.notice||'请按当前页面提示使用。')+'</p><p>体验模式使用虚构示例。新填内容及所选图片仅保留在当前页面内存，刷新或退出后会丢失，不发送到老师后台。请勿在体验版输入真实个人健康信息。</p></article>'+footer()+'</div>';}
function trashPage(){const mine=archivedCases.filter(c=>demo||c.owner_id===user?.id||role==='admin').sort((a,b)=>String(b.deleted_at).localeCompare(String(a.deleted_at)));return shell('<div class="page-heading"><div><div class="eyebrow">RECYCLE BIN</div><h1>档案回收站</h1><p>误填或重复的档案暂存在这里，恢复后可继续记录。</p></div><a class="btn secondary" href="#/home">返回档案</a></div><div class="notice">删除后，档案不再出现在日常列表、对照区和汇总导出中。原有照片与观察仍保留，可在这里恢复。</div><div class="trash-list">'+(mine.length?mine.map(c=>'<article class="panel trash-record"><div><h3>'+esc(c.name)+'</h3><p>'+esc(c.code)+' · '+esc(c.partner_name||'未填记录人')+'</p><small>删除时间 '+esc(new Date(c.deleted_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))+'</small></div><button class="btn secondary tiny" data-restore-case="'+esc(c.id)+'">恢复档案</button></article>').join(''):'<div class="empty"><h3>回收站为空</h3><p>删除的档案会出现在这里。</p></div>')+'</div>','trash');}
function confirmCaseTrash(c,archived){
 if(!canManageRecord(c))return;
 dialog('<div class="eyebrow">'+(archived?'移入回收站':'恢复档案')+'</div><h2>'+esc(c.name)+'</h2><p class="small muted">'+esc(c.code)+'</p><p>'+(archived?'这份档案将从日常列表和对照区移除。照片与观察记录保留，您可以在回收站恢复。':'恢复后，这份档案和原有照片、观察记录将重新显示。')+'</p>'+(dirty?'<div class="notice">当前尚未保存的修改将被放弃。</div>':'')+'<div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">取消</button><button class="btn" data-confirm-trash="'+esc(c.id)+'" data-archived="'+archived+'">'+(archived?'删除并移入回收站':'确认恢复')+'</button></div>');
}
function moveCaseToTrash(c,archived){return withLoading({theme:'records',title:'正在更新档案状态'},()=>moveCaseToTrashContent(c,archived));}
async function moveCaseToTrashContent(c,archived){
 if(!canManageRecord(c))throw Error('您没有这份档案的删除或恢复权限。');
 const previousRoute=cleanHash(),listRoute=['/home','/due','/records','/collect','/library'].includes(previousRoute.split('?')[0]);
 const filters=[...document.querySelectorAll('#search,#kind-filter,#collect-search,#class-filter,#student-filter,#consent-filter,#stage-filter,#date-start,#date-end')].map(el=>[el.id,el.value]),scrollPosition=window.scrollY;
 document.querySelector('#dialog').close();
 busy=true;
 try{if(demo){const saved={...c,deleted_at:archived?new Date().toISOString():null,version:c.version+1};cases=cases.filter(x=>x.id!==c.id);archivedCases=archivedCases.filter(x=>x.id!==c.id);(archived?archivedCases:cases).unshift(saved);}else{checkResult(await db.rpc('set_case_archived',{p_case_id:c.id,p_archived:archived,p_expected_version:c.version}));await refresh();}dirty=false;currentCase=null;history.replaceState(null,'',archived?'#'+(listRoute?previousRoute:(isTeacher()?'/records':'/home')):'#/case/'+c.id);await render();if(archived&&listRoute){for(const [id,value] of filters){const el=document.getElementById(id);if(el){if(el.tagName==='SELECT'&&value&&![...el.options].some(o=>o.value===value))el.add(new Option(value,value));el.value=value;}}if(document.querySelector('#collect-list'))filterCollection();else if(document.querySelector('#record-list'))filterDashboard();window.scrollTo({top:scrollPosition,behavior:'instant'});}notify(archived?'已删除“'+c.name+'”，可在回收站恢复':'档案已恢复');}finally{busy=false;}
}
function memberFailure(error){return shell('<a class="back" href="#/students">← 返回学员列表</a>'+errBox(memberDetailError(error))+'<button class="btn mt" data-action="reload">重新读取</button>','students');}
function drawMember(member){root.innerHTML=shell(memberDetailMarkup(member,{cases,observations:obs,photos,recordMarkup:recordRow}),'students');}
async function openMemberDetail(id,token,feedback){
 const viewer=user?.id,path=cleanHash();
 root.innerHTML=shell('<div class="hhq-loading-spacer"></div>','students');
 if(demo||role!=='admin'){root.innerHTML=memberFailure({code:'42501'});return;}
 feedback?.update('正在打开学员后台','正在读取个人资料、数字性格与服务档案。');
 try{const member=checkResult(await db.rpc('site_member_detail',{p_user_id:id}));
  if(token!==loadId||viewer!==user?.id||path!==cleanHash()||document.hidden)return;
  if(!member||member.id!==id)throw Error('member_mismatch');
  activeMember=member;recordListRoute=path;drawMember(member);
 }catch(error){if(token===loadId&&viewer===user?.id&&path===cleanHash())root.innerHTML=memberFailure(error);}
}
async function verifyMemberDetail(){
 if(!activeMember||memberChecking||document.hidden||busy||demo||!user||!cleanHash().startsWith('/member/'))return;
 memberChecking=true;const token=loadId,viewer=user.id,id=activeMember.id,path=cleanHash();
 try{const member=checkResult(await db.rpc('site_member_detail',{p_user_id:id}));
  if(token!==loadId||viewer!==user?.id||path!==cleanHash()||document.hidden)return;
  if(!member||member.id!==id)throw Error('member_mismatch');
  if(JSON.stringify(member)!==JSON.stringify(activeMember)){activeMember=member;drawMember(member);}
 }catch(error){if(token===loadId&&viewer===user?.id&&path===cleanHash()){activeMember=null;root.innerHTML=memberFailure(error);}}
 finally{memberChecking=false;}
}
document.addEventListener('click',e=>{const section=e.target.closest('[data-member-section]');if(section)document.getElementById(section.dataset.memberSection)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
document.addEventListener('visibilitychange',()=>{
 if(!cleanHash().startsWith('/member/'))return;
 if(document.hidden){memberViewEpoch++;loadId++;activeMember=null;root.innerHTML=shell('<p class="small muted">返回后将重新读取学员资料。</p>','students');}
 else if(user)render();
});
window.addEventListener('hashchange',()=>{memberViewEpoch++;});
setInterval(verifyMemberDetail,15000);

const renderFlights=singleFlight();
function render(){const path=cleanHash();if(path==='/registration-result')return renderContent();return renderFlights(path+(path.startsWith('/member/')?'|'+memberViewEpoch:''),async()=>{const feedback=beginLoading({readOnly:true,theme:path.startsWith('/member/')?'numbers':/\/self(?:\?|$)/.test(path)?'self':undefined,title:path.startsWith('/member/')?'正在打开学员后台':path.startsWith('/case/')?'正在打开这份档案':'正在打开档案页面',detail:'已经收到您的点击，正在准备页面。'});try{return await renderContent(feedback);}finally{feedback.finish();}});}
async function renderContent(feedback){document.body.classList.remove('plan-capture');const token=++loadId;activeMember=null;let path=cleanHash();lastHash=location.hash;if(path==='/privacy'){root.innerHTML=privacy();return;}if(path==='/registration-result'){if(!registrationResult&&db){await checkRegistration();return;}root.innerHTML=registrationPage();return;}if(path==='/forgot'){authMode='forgot';root.innerHTML=authPage();return;}if(path==='/login'){root.innerHTML=authPage();return;}if(profileError&&!demo){root.innerHTML=connectionPage();return;}if(path==='/auth'&&user&&!demo&&authMode!=='setup'){const target=pendingReturn()||loginDestination;if(target&&!target.startsWith('/zhongyi/aform/#')){clearReturn();location.assign(target);return;}path=safeHealthRoute(target.split('#')[1])||requestedRoute;clearReturn();history.replaceState(null,'','#'+path);lastHash=location.hash;}if(path==='/auth'){root.innerHTML=authPage();return;}if(path==='/'&&!demo&&!user){root.innerHTML=welcome();return;}if(!demo&&!user){const next=safeHealthRoute(path);if(next){requestedRoute=next;rememberReturn('/zhongyi/aform/#'+next);}root.innerHTML=authPage();return;}const wasLoaded=loaded;if(!loaded){root.innerHTML='<div class="hhq-loading-spacer"></div>';feedback?.update('正在读取您的档案','取回已有记录后，会自动显示。');try{await refresh();}catch(e){if(token===loadId)root.innerHTML=shell(errBox(friendly(e))+'<button class="btn mt" data-action="reload">重新读取</button>');return;}}if(token!==loadId)return;const parts=path.split('?')[0].split('/');if(['clients','records','collect','home','due','library'].includes(parts[1]))recordListRoute=path;if(parts[1]!=='case')currentCase=null;if(parts[1]==='member'){await openMemberDetail(parts[2],token,feedback);if(token!==loadId)return;}else if(parts[1]==='case'){const c=cases.find(x=>x.id===parts[2]);if(!c){root.innerHTML=shell('<div class="empty">未找到档案，或当前账号无权查看。</div>');return;}if(wasLoaded&&!demo&&currentCase?.id!==c.id){
 const viewer=user?.id;
 try{
  const [observations,storedPhotos]=await Promise.all([fetchAll('observations','*',c.id),fetchAll('photos','*',c.id)]);
  if(token!==loadId||user?.id!==viewer||location.hash!==lastHash)return;
  obs=obs.filter(item=>item.case_id!==c.id).concat(observations);
  photos=photos.filter(item=>item.case_id!==c.id).concat(storedPhotos);
 }catch(error){if(token!==loadId||user?.id!==viewer||location.hash!==lastHash)return;notify('记录暂未刷新，页面显示的是上次读取的内容。');}
}const stageQuery=new URLSearchParams(path.split('?')[1]||'').get('stage');activeStage=preferredStage(c.id,obs,{requested:stageQuery,remembered:stageMemory.get(c.id),caseRecord:c});currentCase=c;stageMemory.set(c.id,activeStage);const tab=parts[3]||'record';if(tab==='record'){const query=new URLSearchParams(path.split('?')[1]||'');query.set('stage',activeStage);history.replaceState(null,'','#/case/'+c.id+'?'+query);lastHash=location.hash;}if(tab==='review'&&!isTeacher()){root.innerHTML=shell(errBox('没有老师权限。'));return;}selfLoadError='';feedback?.update('正在读取客户反馈','正在连接这份档案的观察记录与自评。');if(!demo){try{const rows=await loadSelf(db,c.id);if(token!==loadId)return;selfResponses=rows;}catch(e){if(token!==loadId)return;selfResponses=[];selfLoadError='客户自评暂未载入，请点击刷新客户反馈重试。';}}feedback?.update('正在准备照片与记录','内容就绪后，页面会自动展开。');try{await signPhotos(photos.filter(p=>p.case_id===c.id));}catch(e){notify('部分照片暂时未载入，请重试。');}if(token!==loadId)return;root.innerHTML=detailsPage(c,tab);lockSelfQuote();}else if(parts[1]==='clients'){root.innerHTML=clientsPage();}else if(parts[1]==='comparisons'){const previewPhotos=cases.flatMap(c=>{const v=comparisonAt(caseTimeline(c.id,obs,photos));return [v.baseline?.photos[0],v.selected?.photos[0]].filter(Boolean);});try{await signPhotos([...new Map(previewPhotos.map(p=>[p.id,p])).values()]);}catch(e){notify('部分照片暂时未载入，您仍可查看评分。');}if(token!==loadId)return;root.innerHTML=comparisonsPage();}else if(parts[1]==='new')root.innerHTML=shell(newForm(),'new');else if(parts[1]==='edit'){const c=cases.find(x=>x.id===parts[2]);root.innerHTML=shell(c&&(demo||c.owner_id===user?.id)?newForm(c):errBox('您没有编辑权限。'));}else if(['collect','records','library'].includes(parts[1])){root.innerHTML=collection(parts[1]==='library');if(isTeacher())filterCollection();}else if(parts[1]==='students'){root.innerHTML=studentsPage();if(isTeacher())filterMembers();}else if(parts[1]==='trash')root.innerHTML=trashPage();else if(parts[1]==='account'){root.innerHTML=accountPage();if(!demo)mountEmailPanel(db,document.querySelector('#aform-email-status'));else document.querySelector('#aform-email-status').innerHTML='<h2>邮箱验证</h2><p>体验模式不发送邮件。</p>';}else root.innerHTML=dashboard(parts[1]==='due');syncBirthDate(document.querySelector('#case-form'),{fromValue:true});rememberForm();updateSaveState();centerActiveStage();window.scrollTo({top:0,behavior:'instant'});}
async function saveObservation(form,intent,{quiet=false,formData=null,products=null,preparingPhoto=false}={}){
 const advance=intent==='continue';if(advance)intent='submitted';
 const pending=uploadCounts(photoBatches.get(photoBatchKey())?.items||[]).pending;if(intent==='submitted'&&pending&&!preparingPhoto){document.querySelector('#upload-status')?.scrollIntoView({block:'center'});throw Error('还有'+pending+'张照片尚未上传成功，请先重试或移出待传列表，再提交本次观察。');}
 const c=currentCase,f=formData||new FormData(form),existing=obs.find(o=>o.id===form.dataset.id)||obs.find(o=>o.case_id===c.id&&o.stage===activeStage);
 if(existing&&!dirty&&(!form.dataset.clientSelfId||form.dataset.clientSelfId===existing.data?.clientSelfId)&&(intent!=='submitted'||existing.status==='submitted')){form.dataset.id=existing.id;rememberForm(form);updateSaveState();if(!quiet&&advance){await advanceService(c,existing);return existing;}if(!quiet&&intent==='submitted'){history.replaceState(null,'','#/case/'+c.id+'/compare?visit='+encodeURIComponent(existing.id));await render();}return existing;}
 const data={...existing?.data,ratings:Object.fromEntries(ITEMS.map(([k])=>[k,Number(f.get('rating_'+k))||null])),tongue:Object.fromEntries(['gloss','strength','source','coating','yinyang','form'].map(k=>[k,f.get(k)]).concat([['axis',readAxis(f)],['elements',f.getAll('shape_elements')]])),compare:Object.fromEntries([0,1,2,3].map(k=>[k,f.get('compare_'+k)||'未评'])),products:activeStage==='d1'?(existing?.data?.products||[]):products||readProducts(form,'actual',f),...readWorkflow(f,activeStage,existing?.data)};
 ['usage','action','usageNote','quote','handling','handlingReason','nextDate','nextMethod','lifeChange','tongueChange','partnerReview','nextService','nextFocus'].forEach(k=>{if(f.has(k))data[k]=f.get(k)||'';});
 if(form.elements?.nextDate?.dataset.dateTouched==='true')data.nextDateSetAt=new Date().toISOString();
 if(form.dataset.clientSelfId){const source=selfResponses.find(r=>r.id===form.dataset.clientSelfId&&r.case_id===c.id&&r.stage===activeStage);if(!source)throw Error('请刷新客户自评后再保存。');data.ratings={...source.ratings};data.quote=source.quote;data.clientSelfId=source.id;data.clientSelfSubmittedAt=source.submitted_at;}
 data.planHistory=nextPlanHistory(existing,data,activeStage,intent||'draft');
 const payload={case_id:c.id,stage:activeStage,actual_date:f.get('actual_date'),status:intent||'draft',data};let saved;
 if(demo){saved={...existing,...payload,id:existing?.id||requestUUID(),version:(existing?.version||0)+1};const adjusted=applyActualFollowup(c,obs,saved,existing);saved=adjusted.record;c.progress=adjusted.progress;}
 else if(existing)saved=checkResult(await db.from('observations').update({...payload,version:existing.version+1}).eq('id',existing.id).eq('version',existing.version).select().single());
 else saved=checkResult(await db.from('observations').insert(payload).select().single());
 obs=obs.filter(o=>o.id!==saved.id);obs.push(saved);form.dataset.id=saved.id;dirty=false;rememberForm(form);stageMemory.set(c.id,activeStage);
 if(quiet){updateSaveState();updateCaseActivity();return saved;}
 await refresh();
 if(advance){await advanceService(cases.find(x=>x.id===c.id)||c,saved);return saved;}
 if(intent==='submitted'){
  history.replaceState(null,'','#/case/'+c.id+'/compare?visit='+encodeURIComponent(saved.id));
  await render();
  notify(demo?'体验记录已提交至当前页面':'已提交，照片与评分对照已更新');
 }else{
  await render();
  if(currentCase?.id===c.id&&activeStage===saved.stage)focusObservationArea(root.querySelector('#observation-save'));
 }
 return saved;
}
async function generatePlanImage(saveFirst=false,button=null){
 const feedback=beginLoading({title:saveFirst?'正在保存并生成方案图片':'正在生成方案图片',detail:'图片准备好后会自动显示。'});const oldLabel=button?.textContent;busy=true;if(button){button.disabled=true;button.textContent='正在生成…';}
 try{
  if(saveFirst){
   const form=document.querySelector('#observation-form');if(!form||!form.reportValidity())return;
   syncFormDirty();const existing=obs.find(o=>o.case_id===currentCase.id&&o.stage===activeStage);
   const plan=readWorkflow(new FormData(form),activeStage,existing?.data).plan;
   if(!hasPlan(plan))throw Error('请先填写产品用量或本次安排，再生成图片。');
   await saveObservation(form,existing?.status==='submitted'?'submitted':'draft',{quiet:true});
  }
  const query=new URLSearchParams(cleanHash().split('?')[1]||''),entries=planEntries(currentCase.id,obs);
  const entry=saveFirst?entries.find(e=>e.stage===activeStage&&e.latest):entries.find(e=>e.id===query.get('version'))||entries.find(e=>e.latest&&e.stage===query.get('stage'))||entries.filter(e=>e.latest).at(-1);
  if(!entry)throw Error('请先保存产品方案，再生成图片。');
  await openPlanImage(currentCase,entry,{demo,practitionerName:profile.display_name});
 }finally{feedback.finish();busy=false;if(button){button.disabled=false;button.textContent=oldLabel;}updateSaveState();}
}
async function compress(file){
 cleanImageType(file);
 const url=URL.createObjectURL(file);
 try {
  const image=new Image();
  image.src=url;
  await image.decode();
  const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext('2d');
  context.fillStyle='#ffffff';
  context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(image,0,0,canvas.width,canvas.height);
  const encode=quality=>new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
  const jpeg=await encode(.88);
  if(!jpeg?.size)throw Error('图片处理失败，请更换一张照片。');
  // Large images get a second JPEG pass at the same dimensions.
  if(jpeg.size>480*1024){
   const smaller=await encode(.78);
   if(smaller?.size&&smaller.size<jpeg.size)return smaller;
  }
  return jpeg;
 } finally {
  URL.revokeObjectURL(url);
 }
}
function updatePhotoFeedback(item){
 if(item?.status==='success'&&item.blob){const preview=URL.createObjectURL(item.blob);URL.revokeObjectURL(item.preview);item.preview=preview;item.file={name:item.file.name,size:item.file.size,lastModified:item.file.lastModified};item.blob=null;}
 const el=document.querySelector('#upload-status');
 if(el&&currentCase)el.innerHTML=photoBatchMarkup(currentCase,activeStage);
}
function updatePhotoGrid(){
 const grid=document.querySelector('#observation-form .photo-grid');
 const currentPhotos=photos.filter(p=>p.case_id===currentCase.id&&p.stage===activeStage);if(grid)grid.innerHTML=currentPhotos.map(photoThumb).join('');const ref=document.querySelector('#photoReference');if(ref&&!ref.value&&currentPhotos.length)ref.value=currentPhotos.map(p=>p.file_no).join(' / ');
}
async function persistPhoto(item,phase,c,stage,{signal,viewerId}={}){
 const guard=()=>{if(signal?.aborted||(!demo&&user?.id!==viewerId)||currentCase?.id!==c.id||activeStage!==stage)throw Object.assign(Error('photo_account_changed'),{code:'photo_account_changed'});};guard();
 const o=obs.find(o=>o.case_id===c.id&&o.stage===stage);
 if(!o)throw Error('本次观察尚未保存，请重试。');
 if(!item.metadata)item.metadata={id:item.id,case_id:c.id,stage,taken_on:o.actual_date,uploader_name:profile.display_name||c.partner_name,size_bytes:item.blob.size,kind:'tongue'};
 let saved;
 if(demo){phase('confirming');saved={...item.metadata,file_no:'P'+item.id.slice(0,6).toUpperCase(),url:URL.createObjectURL(item.blob)};}
 else{
  item.path ||= c.id+'/'+item.id+'.jpg';
  if(!item.storageUploaded){
   await transferPhoto({db,key:config.key,item,expectedUserId:viewerId,signal,phase,progress:()=>updatePhotoFeedback(item)});guard();
   item.storageUploaded=true;
  }
  phase('confirming');
  guard();
  saved=await savePhotoRecord({db,item,signal});
 }
 guard();if(!saved?.id)throw Error('照片保存尚未确认，请重试。');
 photos=photos.filter(p=>p.id!==saved.id);photos.push(saved);return saved;
}
async function performPhotoUpload(){
 const form=document.querySelector('#observation-form'),batch=photoBatches.get(photoBatchKey());
 if(!form||!batch||busy||!uploadCounts(batch.items).pending)return;
 if(!form.reportValidity()){batch.error='请先补全页面标出的必填项，再重试上传。';updatePhotoFeedback();return;}
 const c=currentCase,stage=activeStage,existing=obs.find(o=>o.case_id===c.id&&o.stage===stage);
 const snapshot=new FormData(form),products=readProducts(form),controls=[...form.querySelectorAll('input,select,textarea,button')].map(el=>[el,el.disabled]);
 const controller=new AbortController(),viewerId=user?.id;photoController=controller;
 busy=true;batch.running=true;batch.loadingBlessing=null;batch.error='';batch.slow=false;batch.phase='saving';
 controls.forEach(([el])=>el.disabled=true);form.querySelector('.photo-grid')?.setAttribute('aria-busy','true');updatePhotoFeedback();
 document.querySelector('#upload-status')?.scrollIntoView({block:'center'});
 const slowTimer=setTimeout(()=>{batch.slow=true;updatePhotoFeedback();},15000);
 try{
  if(!c.consent_photo)throw Error('请先取得本人照片保存授权。');
  if(!demo&&c.owner_id!==user?.id)throw Error('当前账号没有上传权限。');
  if(photos.filter(p=>p.case_id===c.id&&p.stage===stage).length+batch.items.filter(i=>i.status!=='success'&&!photos.some(p=>p.id===i.id)).length>3)throw Error('每次观察最多3张照片，请移出多余的待传照片。');
  if(dirty||!existing)await saveObservation(form,existing?.status||'draft',{quiet:true,formData:snapshot,products,preparingPhoto:true});
  batch.phase='uploading';updatePhotoFeedback();
  if(controller.signal.aborted)return;
  await runPhotoBatch({items:batch.items,signal:controller.signal,prepare:compress,persist:(item,phase)=>persistPhoto(item,phase,c,stage,{signal:controller.signal,viewerId}),onChange:updatePhotoFeedback,message:photoUploadMessage});
 }catch(error){batch.error=friendly(error);}
 finally{
  clearTimeout(slowTimer);batch.running=false;busy=false;if(photoController===controller)photoController=null;if(controller.signal.aborted||(!demo&&user?.id!==viewerId)||currentCase?.id!==c.id)return;controls.forEach(([el,disabled])=>el.disabled=disabled);form.querySelector('.photo-grid')?.removeAttribute('aria-busy');
  updatePhotoGrid();updatePhotoFeedback();updateCaseActivity();if(!dirty)rememberForm(form);updateObservationProgress();
  const photoFeedback=document.querySelector('#upload-status .upload-result-actions')||document.querySelector('#upload-status');
  photoFeedback?.scrollIntoView({block:'center'});
  const counts=uploadCounts(batch.items);updateSaveState();
  notify(counts.pending?'有照片尚未成功，请在上传区重试。':demo?'照片已添加到体验页面，未上传':'照片上传成功，已私密保存');
 }
}
async function selectPhotos(input){
 const files=[...input.files];choosingPhoto=false;input.value='';
 if(!files.length||busy||!document.querySelector('#observation-form'))return;
 const key=photoBatchKey();let batch=photoBatches.get(key);
 if(!batch){batch={items:[],running:false,error:''};photoBatches.set(key,batch);}
 try{
  if(!currentCase.consent_photo)throw Error('请先取得本人照片保存授权。');
  if(!demo&&currentCase.owner_id!==user?.id)throw Error('当前账号没有上传权限。');
  files.forEach(cleanImageType);
  const fresh=files.filter(file=>!batch.items.some(item=>(item.status!=='success'||photos.some(p=>p.id===item.saved?.id))&&item.file.name===file.name&&item.file.size===file.size&&item.file.lastModified===file.lastModified));
  if(!fresh.length){notify('这些照片已在本次上传列表中，无需重复选择。');return;}
  const current=photos.filter(p=>p.case_id===currentCase.id&&p.stage===activeStage).length;
  if(current+uploadCounts(batch.items).pending+fresh.length>3)throw Error('每次观察最多3张照片，请减少选择或移出待传照片。');
  const shot=document.querySelector('#observation-form input[name="photoStatus"][value="已拍"]');if(shot)shot.checked=true;dirty=true;batch.items.push(...createPhotoTasks(fresh));batch.error='';updatePhotoFeedback();await performPhotoUpload();
 }catch(error){batch.error=friendly(error);updatePhotoFeedback();notify(batch.error);}
}
function dialog(html,light=false){const d=document.querySelector('#dialog');d.className=light?'lightbox':'';d.innerHTML=html;d.showModal();}
function download(content,type,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportCSV(){if(!isTeacher())throw Error('需要老师权限。');const records=filteredCollection(),rows=[['档案编号','称呼','类型','班级','记录学员','出生年月日','手机号','其他联系方式','建档日期','教学授权','观察阶段','实际日期','状态','精神','睡眠','食欲','排便','情绪','本人原话','下一回访日期','照片编号',...DETAIL_COLUMNS]];records.forEach(c=>{const list=obs.filter(o=>o.case_id===c.id);(list.length?list:[{}]).forEach(o=>rows.push([c.code,c.name,c.kind==='self'?'本人':'服务对象',c.class_name,c.partner_name,c.birth_date||'',caseIdentity(c).phone,c.contact,c.created_on,c.consent_teaching?'同意':'不同意',o.stage?stageName(o.stage):'',o.actual_date,o.status==='submitted'?'已提交':'草稿',...ITEMS.map(([k])=>o.data?.ratings?.[k]??((!o.stage||o.stage==='d1')?c.baseline?.initialRatings?.[k]??'':'')),o.data?.quote||'',o.data?.nextDate||'',photos.filter(p=>p.case_id===c.id&&(!o.stage||p.stage===o.stage)).map(p=>p.file_no).join(' / '),...detailValues(c,o)]));});download(csv(rows),'text/csv;charset=utf-8','上医健康管理服务表_'+(demo?'演示_':'')+'档案汇总_'+today()+'.csv');notify('已导出当前筛选的 '+records.length+' 份档案');}
function exportCase(){return withLoading({theme:'records',title:'正在准备匿名案例'},()=>exportCaseContent());}
async function exportCaseContent(){if(!isTeacher())throw Error('需要老师权限。');let c=currentCase;if(!demo)c=checkResult(await db.from('cases').select('*').eq('id',c.id).single());if(!canTeach(c))throw Error('本档案尚未授权教学，或已撤回授权。');const list=obs.filter(o=>o.case_id===c.id&&o.status==='submitted').sort((a,b)=>a.actual_date.localeCompare(b.actual_date));const content='<h1>匿名观察案例 · '+esc(c.code)+'</h1><p>用于课程学习与状态观察，不作为诊断或疗效证明。</p><p>仅导出日期与本人主观评分，未包含姓名、电话、原始自由文本和照片。</p><table><thead><tr><th>日期</th><th>节点</th>'+ITEMS.map(([,l])=>'<th>'+l+'</th>').join('')+'</tr></thead><tbody>'+list.map(o=>'<tr><td>'+esc(o.actual_date)+'</td><td>'+stageName(o.stage)+'</td>'+ITEMS.map(([k])=>'<td>'+esc(o.data?.ratings?.[k]??'未评')+'</td>').join('')+'</tr>').join('')+'</tbody></table><p>1 差 · 2 偏差 · 3 一般 · 4 较好 · 5 很好；“未评”不计为分值。</p><p>生成日期：'+today()+(demo?' · 演示数据':'')+'</p>';dialog('<div class="case-print">'+content+'</div><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">返回</button><button class="btn" id="download-case">下载匿名案例</button></div>');document.querySelector('#download-case').onclick=()=>{download('<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><title>匿名观察案例 '+esc(c.code)+'</title><style>body{max-width:850px;margin:40px auto;padding:25px;font:16px/1.8 sans-serif;color:#173c33}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:10px}h1{font-size:26px}@media print{body{margin:0}}</style>'+content+'</html>','text/html;charset=utf-8','匿名观察案例_'+c.code+'.html');document.querySelector('#dialog').close();};}
async function saveReview(form){if(!isTeacher())throw Error('没有老师权限。');const f=new FormData(form),payload={case_id:currentCase.id,org_status:f.get('org_status'),tags:String(f.get('tags')).split(/[,，]/).map(s=>s.trim()).filter(Boolean),comment:f.get('comment'),updated_at:new Date().toISOString()};if(demo){const old=reviews.find(r=>r.case_id===currentCase.id);if(old)Object.assign(old,payload);else reviews.push(payload);}else checkResult(await db.from('teacher_reviews').upsert({...payload,updated_by:user.id}));dirty=false;rememberForm(form);await refresh();notify('整理已保存');}
function patchCase(payload){return withLoading({theme:'save',title:'正在保存档案设置'},()=>patchCaseContent(payload));}
async function patchCaseContent(payload){const c=currentCase;if(demo)Object.assign(c,payload,{version:c.version+1});else checkResult(await db.from('cases').update({...payload,version:c.version+1}).eq('id',c.id).eq('version',c.version).select().single());await refresh();dirty=false;render();}
document.addEventListener('click',async e=>{const b=e.target.closest('button,a');const a=e.target.closest('a[href^="#/"]');if(busy&&b){e.preventDefault();notify('正在保存或上传，请稍候。');return;}if(a){e.preventDefault();go(a.getAttribute('href').slice(1));return;}if(b?.matches('[data-retry-photo-preview]')){await retryPhotoPreview(b);return;}const z=e.target.closest('[data-zoom]');if(z){dialog('<img src="'+esc(z.dataset.zoom)+'" alt="观察照片放大查看"><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">关闭</button></div>',true);return;}if(!b||b.dataset.selfAction)return;try{if(b.dataset.journeyCase){const c=cases.find(x=>x.id===b.dataset.journeyCase);if(c&&(demo||c.owner_id===user?.id))await openJourneyOwner(c,{db,demo,dialog,notify});return;}if(b.dataset.shapeCombo){const form=document.querySelector('#observation-form');form.querySelector('[name="form"]').value=b.dataset.shapeCombo;form.querySelectorAll('[name="shape_elements"]').forEach(x=>x.checked=b.dataset.shapeCombo.includes(x.value));dirty=true;updateObservationProgress();return;}if(b.dataset.memberDelete){await openMemberDeletion(b.dataset.memberDelete);return;}if(b.dataset.removeUpload){const batch=photoBatches.get(photoBatchKey()),item=batch?.items.find(i=>i.id===b.dataset.removeUpload);if(item&&item.status!=='success'){URL.revokeObjectURL(item.preview);batch.items=batch.items.filter(i=>i!==item);batch.error='';if(!batch.items.length)photoBatches.delete(photoBatchKey());updatePhotoFeedback();}return;}if(b.dataset.deleteCase){confirmCaseTrash(cases.find(c=>c.id===b.dataset.deleteCase),true);return;}if(b.dataset.confirmTrash){await moveCaseToTrash([...cases,...archivedCases].find(c=>c.id===b.dataset.confirmTrash),b.dataset.archived==='true');return;}if(b.dataset.restoreCase){confirmCaseTrash(archivedCases.find(c=>c.id===b.dataset.restoreCase),false);return;}if(b.dataset.auth){authMode=['signup','forgot'].includes(b.dataset.auth)?b.dataset.auth:'login';authMessage='';go(cleanHash()==='/login'?'/login':'/auth');return;}if(b.dataset.rating){const group=b.closest('.rating-buttons');group.querySelectorAll('button').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});group.querySelector('input').value=b.dataset.value;dirty=true;updateObservationProgress();return;}if(b.dataset.tab){go('/case/'+currentCase.id+'/'+b.dataset.tab+'?stage='+activeStage);return;}if(b.dataset.stage){if(dirty&&!confirm('当前观察尚未保存，确定切换吗？'))return;activeStage=b.dataset.stage;dirty=false;go('/case/'+currentCase.id+'?stage='+activeStage);return;}if(b.dataset.removeProduct!==undefined){const target=b.closest('[data-product-scope]');if(target?.dataset.productScope==='plan'&&productTemplate(target.querySelector('[name^="plan_product_name_"]')?.value)){notify('原表固定产品请选“未用”，无需删除。');return;}const form=document.querySelector('#observation-form'),scope=b.dataset.scope||'actual',rows=readProducts(form,scope);rows.splice(Number(b.dataset.removeProduct),1);document.querySelector(scope==='plan'?'#plan-product-rows':'#product-rows').outerHTML=productsHTML(rows,scope);if(scope==='plan')draftPlanProducts=rows;else draftProducts=rows;dirty=true;updateObservationProgress();return;}if(b.dataset.deletePhoto){if(!confirm('确定删除这张照片？此操作无法撤销。'))return;const p=photos.find(x=>x.id===b.dataset.deletePhoto);if(demo){if(p.url?.startsWith('blob:'))URL.revokeObjectURL(p.url);photos=photos.filter(x=>x.id!==p.id);}else{await withLoading({theme:'records',title:'正在删除这张照片'},async()=>{checkResult(await db.storage.from('case-photos').remove([p.storage_path]));checkResult(await db.from('photos').delete().eq('id',p.id));await refresh();});}render();return;}switch(b.dataset.action){case 'verification-continue':await continueRegistration(b.dataset.destination);break;case 'verification-login':returnToLogin();break;case 'verification-retry':await retryRegistration();break;case 'reconnect-account':await reconnectAccount();break;case 'plan-image':await generatePlanImage(false,b);break;case 'plan-image-save':await generatePlanImage(true,b);break;case 'plan-capture':document.body.classList.add('plan-capture');window.scrollTo({top:0,behavior:'instant'});break;case 'plan-capture-exit':document.body.classList.remove('plan-capture');window.scrollTo({top:0,behavior:'instant'});break;case 'copy-browser-link':await copyBrowserLink(b);break;case 'retry-photos':await performPhotoUpload();break;case 'copy-photo-diagnostic':{const batch=photoBatches.get(photoBatchKey());if(batch){const info=photoDiagnostic(batch);try{await navigator.clipboard.writeText(info);notify('排查信息已复制，不含照片和个人资料。');}catch{dialog('<h2>照片上传排查</h2><pre style="white-space:pre-wrap">'+esc(info)+'</pre><button class="btn" data-action="close-dialog">关闭</button>');}}break;}case 'archive-case':confirmCaseTrash(currentCase,true);break;case 'start':live()?go('/auth'):beginDemo(false);break;case 'student-demo':beginDemo(false);break;case 'exit-demo':if((dirty||hasPendingPhotos())&&!confirm('退出后，体验记录会丢失。确定退出吗？'))break;photos.forEach(p=>{if(p.url?.startsWith('blob:'))URL.revokeObjectURL(p.url);});clearPhotoBatches();demo=false;teacherDemo=false;dirty=false;cases=[];archivedCases=[];obs=[];photos=[];selfResponses=[];loaded=false;go('/');break;case 'logout':if(hasPendingPhotos()&&!confirm('还有未成功上传的照片，退出后需重新选择。确定退出吗？'))break;checkResult(await withLoading({theme:'account',title:'正在退出账号'},()=>db.auth.signOut({scope:'local'})));user=null;loaded=false;cases=[];archivedCases=[];obs=[];photos=[];selfResponses=[];signed.clear();go('/');break;case 'reload':case 'refresh-workspace':{const feedback=beginLoading({readOnly:true,title:'正在刷新档案',button:b});try{if(!demo&&user)await loadProfile();loaded=false;await render();}finally{feedback.finish();}break;}case 'pick-photo':case 'take-photo':choosingPhoto=true;document.querySelector(b.dataset.action==='pick-photo'?'#photo-input':'#camera-input').click();break;case 'add-product':case 'add-product-template':{const form=document.querySelector('#observation-form'),scope=b.dataset.scope||'actual',rows=readProducts(form,scope);let names=PRODUCTS.slice(0,6);if(b.dataset.action==='add-product'){let name=document.querySelector(scope==='plan'?'#plan-product-select':'#product-select').value;if(name==='other'){dialog('<h2>添加其他产品</h2><label class="label" for="custom-product-name">产品名称</label><input class="input" id="custom-product-name" maxlength="80"><div class="dialog-actions"><button class="btn secondary" data-action="close-dialog">取消</button><button class="btn" data-action="confirm-product" data-scope="'+scope+'">添加</button></div>');break;}names=[name];}for(const name of names){if(!rows.some(p=>p.name===name))rows.push(productWithPlanTime({name,time:'',amount:'',unit:'',perDay:'',unused:false,useStatus:scope==='plan'?'待填写':'待核对'},scope));}document.querySelector(scope==='plan'?'#plan-product-rows':'#product-rows').outerHTML=productsHTML(rows,scope);dirty=true;updateObservationProgress();break;}case 'confirm-product':{const name=document.querySelector('#custom-product-name').value.trim(),scope=b.dataset.scope||'actual';if(!name){notify('请填写产品名称');break;}const rows=readProducts(document.querySelector('#observation-form'),scope);rows.push(productWithPlanTime({name,useStatus:scope==='plan'?'待填写':'待核对'},scope));document.querySelector(scope==='plan'?'#plan-product-rows':'#product-rows').outerHTML=productsHTML(rows,scope);document.querySelector('#dialog').close();dirty=true;updateObservationProgress();break;}case 'csv-export':exportCSV();break;case 'case-export':await exportCase();break;case 'close-dialog':memberDeletion=null;document.querySelector('#dialog').close();break;case 'revoke':if(confirm('撤回后，本档案将从教学案例库排除。确定撤回吗？')){await patchCase({consent_teaching:false});notify('已撤回教学案例授权');}break;case 'request-delete':if(confirm('提交删除申请后，老师可在后台看到申请。原记录在完成删除前仍会保留。')){await patchCase({deletion_requested:true});notify('删除申请已记录');}break;}}catch(err){notify(friendly(err));}});
document.addEventListener('input',e=>{if(e.target.matches('[data-birth-part]')){syncBirthDate(e.target.form);syncBirthSummary(e.target.form);}if(e.target.name==='birth_date')syncBirthSummary(e.target.form);if(e.target.id==='member-confirm-email'){const button=document.querySelector('#delete-member-form button[type=submit]');if(button)button.disabled=!matchingEmail(e.target.value,memberDeletion?.email);}if(e.target.type!=='file'&&e.target.closest('#case-form,#observation-form,#review-form,#profile-form')){syncFormDirty();updateSaveState();}if(e.target.id==='client-search')filterClients();if(e.target.id==='comparison-search')filterComparisons();if(e.target.id==='name')matchingCaseHint();if(e.target.id==='search')filterDashboard();if(e.target.id==='collect-search')filterCollection();if(e.target.id==='member-search')filterMembers();});
function filterDashboard(){const due=document.querySelector('#record-list')?.dataset.due==='true',q=document.querySelector('#search')?.value.toLowerCase()||'',kind=document.querySelector('#kind-filter')?.value||'';const list=cases.filter(c=>(!q||(c.name+c.code+c.class_name).toLowerCase().includes(q))&&(!kind||c.kind===kind)&&(!due||(()=>{const n=nextFollow(c,obs);return n&&n.date<=today();})()));document.querySelector('#record-list').innerHTML=list.length?list.map(recordRow).join(''):'<div class="empty">没有符合条件的档案。</div>';}
function filterCollection(){const list=filteredCollection();document.querySelector('#collect-list').innerHTML=list.length?list.map(recordRow).join(''):'<div class="empty">没有符合条件的档案。</div>';document.querySelector('#collect-count').textContent=list.length+' 份记录';}
document.addEventListener('change',async e=>{const t=e.target;try{if(t.matches('[data-birth-part]')){syncBirthDate(t.form);syncBirthSummary(t.form);}if(t.closest('#observation-form')){if(['nextDate','plan_startDate','plan_endDate'].includes(t.name))t.dataset.dateTouched='true';if(t.name==='actual_date')syncActualDateFields(t.form);}if(t.type==='file'){await selectPhotos(t);return;}if(t.name==='birth_date')syncBirthSummary(t.form);if(t.name==='kind'&&t.closest('#case-form')){syncCaseIdentity(t.form,profile);syncBirthDate(t.form,{fromValue:true});syncBirthSummary(t.form);matchingCaseHint();}if(t.matches('[data-study-choice]'))syncStudyField(t);if(t.name==='axis'&&t.closest('#observation-form'))syncAxisChoices(t.form,t);if(t.closest('#case-form,#observation-form,#review-form,#profile-form')){dirty=true;updateObservationProgress();}if(t.id==='comparison-visit'){go('/case/'+currentCase.id+'/compare?visit='+encodeURIComponent(t.value));return;}if(t.id==='member-state')filterMembers();if(t.id==='kind-filter')filterDashboard();if(['class-filter','student-filter','consent-filter','stage-filter','date-start','date-end'].includes(t.id))filterCollection();if(t.dataset.compare!==undefined){const p=photos.find(p=>p.id===t.value),i=t.dataset.compare,im=document.querySelector('#compare-image-'+i),url=p.url||signed.get(p.storage_path)||'';im.src=url;im.dataset.zoom=url;document.querySelector('#compare-caption-'+i).innerHTML=dateText(p.taken_on)+' · '+stageName(p.stage)+'<br>记录人：'+esc(p.uploader_name||currentCase.partner_name);}}catch(err){busy=false;notify(friendly(err));}});
document.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const f=e.target,submitter=e.submitter,buttons=[...f.querySelectorAll('button[type=submit]')];const feedback=beginLoading({title:f.id==='auth-form'?(authMode==='signup'?'正在注册账号':authMode==='forgot'?'正在发送重设邮件':'正在确认登录'):'正在保存您的记录',detail:'已收到本次操作，请不要重复提交。',button:submitter||buttons[0]});busy=true;buttons.forEach(b=>b.disabled=true);const er=f.querySelector('#form-error');if(er)er.innerHTML='';try{if(f.id==='delete-member-form')await deleteMember(f);else if(f.id==='case-form')await saveCase(f);else if(f.id==='observation-form')await saveObservation(f,submitter?.value);else if(f.id==='review-form')await saveReview(f);else if(f.id==='profile-form'){const p=profileFromForm(f);if(!demo){const saved=await savePersonalProfile(db,p,{expectedUserId:f.dataset.userId});if(user?.id!==saved.user.id)return;user=saved.user;}Object.assign(profile,p);dirty=false;await render();notify(demo?'体验资料已保存，仅保留在当前页面。':'资料已保存，网站账号与上医健康管理服务表已同步。');}else if(f.id==='auth-form'){if(!live())throw Error('正式入口尚未开放，请先使用体验版。');const data=new FormData(f),email=String(data.get('email')).trim(),password=data.get('password');if(authMode==='signup'){if(password!==data.get('confirm_password'))throw Error('两次密码不一致，请重新输入。');const r=checkResult(await db.auth.signUp({email,password,options:{data:signupProfileFromForm(f),emailRedirectTo:authReturnUrl(location)}}));if(r.session){user=r.user;loaded=false;await checkRegistration();}else{rememberPendingEmail(email);location.assign(verificationUrl(location));}}else if(authMode==='setup'){if(!user)throw Error('开通链接已失效，请重新获取邮件。');if(password!==data.get('confirm_password'))throw Error('两次密码不一致，请重新输入。');checkResult(await db.auth.updateUser({password}));await loadProfile();authMode='login';authMessage='';loaded=false;finishLogin();}else if(authMode==='forgot'){checkResult(await db.auth.resetPasswordForEmail(email,{redirectTo:authReturnUrl(location)}));authMessage='若邮箱已注册，将收到密码重设邮件。请从邮件链接设置新密码。';render();}else{const r=checkResult(await db.auth.signInWithPassword({email,password}));user=r.user;await loadProfile();loaded=false;finishLogin();}}}catch(err){if(err?.code==='email_not_confirmed')rememberPendingEmail(f.elements.email?.value);if(profileError){f.reset();if(authMode!=='setup')history.replaceState(null,'','#'+requestedRoute);await render();}else if(er)er.innerHTML=errBox(err instanceof ProfileError?err.message:f.id==='delete-member-form'?memberError(err):friendly(err));else notify(friendly(err));}finally{feedback.finish();busy=false;buttons.forEach(b=>b.disabled=f.id==='auth-form'&&!live()||f.id==='delete-member-form'&&!matchingEmail(f.elements.confirm_email?.value,memberDeletion?.email));updateSaveState();}});
window.addEventListener('beforeunload',e=>{if(dirty||busy||hasPendingPhotos()){e.preventDefault();e.returnValue='';}});
document.addEventListener('cancel',e=>{if(e.target.type==='file')choosingPhoto=false;},true);
window.addEventListener('hashchange',()=>{if(busy){history.replaceState(null,'',lastHash||'#/home');notify('正在保存或上传，请稍候。');return;}if(dirty&&!confirm('有尚未保存的修改，确定离开吗？')){history.replaceState(null,'',lastHash||'#/home');return;}dirty=false;render();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!demo&&!dirty&&!busy&&user&&cleanHash()==='/account'){loadProfile().then(()=>{if(!dirty&&!busy)return render();}).catch(()=>notify('资料暂未刷新，请检查网络后重试。'));}if(document.visibilityState==='visible'&&!demo&&currentCase&&!dirty&&!busy&&!choosingPhoto&&!hasPendingPhotos()&&user){signed.clear();render();}});
function connectionPage(){
  return '<div class="wrap"><header class="site-head">'+brand+'<a class="text-btn" href="../../#home">返回网站 ↗</a></header><main class="auth-shell"><section class="panel" role="alert"><div class="eyebrow">连接暂未完成</div><h1 style="font-size:30px;margin-top:14px">稍后，继续记录。</h1><p>登录信息仍保留，请检查网络后重试。</p><button class="btn full" data-action="reconnect-account">重新连接</button></section></main></div>';
}
async function loadProfile(){
  const userId=user?.id;if(!userId)return;
  try{
    const p=checkResult(await db.from('profiles').select('*').eq('id',userId).maybeSingle());
    const rows=checkResult(await db.from('user_roles').select('role').eq('user_id',userId))||[];
    if(user?.id!==userId)return;
    const personal=await readPersonalProfile(db,{legacy:p,expectedUserId:userId});if(user?.id!==userId)return;user=personal.user;profile={...p,...personal.profile};role=accountRole(rows);staff=role==='teacher'||role==='admin';profileError='';
  }catch(e){
    if(user?.id!==userId)return;
    profile={};staff=false;role='student';members=[];loaded=false;cases=[];archivedCases=[];obs=[];photos=[];selfResponses=[];reviews=[];currentCase=null;signed.clear();profileError='account_unavailable';
    throw e;
  }
}
const reconnectFlights=singleFlight();
function reconnectAccount(){return reconnectFlights('reconnect',async()=>{const feedback=beginLoading({readOnly:true,title:'正在重新连接账号'});try{return await reconnectAccountPage();}finally{feedback.finish();}});}
async function reconnectAccountPage(){
  if(!db){profileError='';await boot();return;}
  try{
    const session=checkResult(await db.auth.getSession()).session;
    if(!session){clearSession();go('/auth');return;}
    if(user?.id!==session.user.id)clearSession();
    user=session.user;await loadProfile();loaded=false;
    if(authMode!=='setup'&&cleanHash()==='/auth')history.replaceState(null,'','#'+requestedRoute);
    await render();
  }catch(e){profileError='account_unavailable';await render();notify('连接还未恢复，请稍后重试。');}
}
async function retryRegistration(){
 if(busy)return;busy=true;
 try{if(db)await checkRegistration();else await boot();}finally{busy=false;}
}
function clearSession(){activeMember=null;clearPhotoBatches();stageMemory.clear();recordListRoute='';dirty=false;profileError='';loadId++;user=null;profile={};staff=false;role='student';members=[];loaded=false;cases=[];archivedCases=[];obs=[];photos=[];selfResponses=[];reviews=[];currentCase=null;signed.clear();}
const bootFlights=singleFlight();
function boot(){return bootFlights('boot',async()=>{const feedback=beginLoading({readOnly:true,title:'正在打开健康档案',detail:'正在连接您的账号。'});try{return await bootPage(feedback);}finally{feedback.finish();}});}
async function bootPage(feedback){
  const callback=authCallback(location.hash);
  const verificationEntry=callback.signup||Boolean(callback.error)||cleanHash()==='/registration-result';
  if(verificationEntry){registrationResult={state:'pending'};root.innerHTML=registrationPage();}
  if(live()){
    try{
      await loadAccountSdk();
      if(!window.supabase||!config.url||!config.key)throw Error('账号连接暂时不可用，请刷新后重试。');
      db=window.supabase.createClient(config.url,config.key,{
        global:{fetch:publicApiFetch(config.key)},
        auth:{persistSession:true,storage:browserSessionStorage,autoRefreshToken:true,detectSessionInUrl:true}
      });
      db.auth.onAuthStateChange((event,session)=>{
        if(authMode==='signup'&&busy&&event==='SIGNED_IN'){if(session?.user)user=session.user;return;}if(registrationResult){if(session?.user)user=session.user;else if(event==='SIGNED_OUT')clearSession();return;}
        if(cleanHash()==='/login'&&event==='SIGNED_IN'&&session){user=session.user;return;}
        if(event==='SIGNED_OUT'){
          clearSession();
          if(!demo){dirty=false;history.replaceState(null,'','#/auth');setTimeout(()=>render(),0);}
        }else if(event==='USER_UPDATED'&&session&&user?.id===session.user.id){user=session.user;if(!busy&&!dirty)setTimeout(async()=>{try{await loadProfile();if(!busy&&!dirty)await render();}catch{notify('资料暂未刷新，请检查网络后重试。');}},0);}
        else if(event==='TOKEN_REFRESHED'&&session&&user?.id===session.user.id)user=session.user;
        else if(event==='SIGNED_IN'&&session)setTimeout(async()=>{if(user?.id===session.user.id)return;clearSession();user=session.user;try{await loadProfile();}catch{}await render();},0);
      });
      if(verificationEntry){await checkRegistration(callback);return;}
      feedback.update('正在确认登录状态','正在核对当前账号，请稍候。');const session=checkResult(await db.auth.getSession());
      user=session.session?.user||null;
      if(user){
        if(callback.setup){authMode='setup';history.replaceState(null,'','#/auth');}
        else if(callback.received)history.replaceState(null,'','#/auth');
        feedback.update('正在读取账号资料','即将进入您的档案空间。');await loadProfile();
      }else if(callback.setup||callback.error){
        authMessage=callback.error||'链接已失效，请重新获取开通或密码重设邮件。';
        history.replaceState(null,'','#/auth');
      }

    }catch(e){if(verificationEntry){registrationResult={state:'retry'};if(db)history.replaceState(null,'','#/registration-result');root.innerHTML=registrationPage();return;}profileError='account_unavailable';notify('连接暂未完成，请稍后重试。');}
  }
  if(cleanHash()==='/tongue-demo'||cleanHash()==='/followup-demo'){const section=cleanHash();demo=true;teacherDemo=false;seedDemo();go(section==='/tongue-demo'?'/case/demo-1/compare':'/due');return;}
  if(cleanHash()==='/demo'){beginDemo(false);return;}
  if(cleanHash()==='/teacher-demo'){history.replaceState(null,'','#/auth');}
  await render();
}
window.addEventListener('online',()=>{if(profileError&&!busy)reconnectAccount();});
boot();

function lockSelfQuote(){
 const form=document.querySelector('#observation-form');if(!form?.dataset.clientSelfId)return;
 const quote=form.elements.quote;if(quote){quote.readOnly=true;quote.setAttribute('aria-label','客户原话（保留原始自评）');}
}
async function showSelfLink(stage,action='get'){
 const c=currentCase,actor=user?.id;
 if(demo){notify('体验档案不生成真实客户链接，请在自己的正式档案中使用。');return;}
 if(!c||c.owner_id!==actor)throw Error('只有本档案的建档人可以发送自评链接。');
 const result=checkResult(await db.rpc('manage_client_self_link',{p_case_id:c.id,p_stage:stage,p_action:action}));
 if(user?.id!==actor||currentCase?.id!==c.id)return;
 if(action==='revoke'){notify('当前节点链接已停用，已有自评记录保留。');return;}
 const url=selfLink(result.token,location),message=c.name+'，请填写第'+stage.slice(1)+'天的自评，点开即可填写：\n'+url;
 dialog('<h2>第 '+stage.slice(1)+' 天 · 客户自评链接</h2><p>'+esc(c.name)+' · '+esc(c.code)+'</p><p class="small muted">'+(result.status==='submitted'?'这条链接已收到填写。需要更正时，请返回“链接管理”重新邀请。':'复制后发给本人。客户无需注册，填写五项体感'+(stage==='d1'?'':'、四有行动')+'和感受。')+'</p><label class="small" for="self-share-text">发送内容</label><textarea readonly class="input self-copy-box" id="self-share-text">'+esc(message)+'</textarea><p class="small muted">有效至 '+esc(new Date(result.expires_at).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}))+'。链接仅用于本节点，不开放档案或照片查看。</p><div class="self-copy-actions"><button class="btn secondary" data-action="close-dialog">关闭</button><button class="btn" id="self-copy-confirm">复制链接与说明</button></div><p id="self-copy-status" class="small muted" role="status"></p>');
 const copy=async()=>{const field=document.querySelector('#self-share-text'),status=document.querySelector('#self-copy-status');try{await navigator.clipboard.writeText(message);status.textContent='已复制，可以粘贴到微信发送给本人。';}catch(e){field.focus();field.select();status.textContent='请长按上方文字选择复制，或使用键盘复制。';}};
 document.querySelector('#self-copy-confirm').onclick=copy;
 await copy();
}
function applySelfResponse(id){
 const form=document.querySelector('#observation-form'),r=selfResponses.find(r=>r.id===id&&r.case_id===currentCase?.id&&r.stage===activeStage);
 if(!form||!r)return;
 form.querySelector('.ratings').outerHTML=selfRatings(r.ratings);
 if(form.elements.quote)form.elements.quote.value=r.quote;
 form.dataset.clientSelfId=r.id;lockSelfQuote();dirty=true;updateObservationProgress();
 notify('已填入客户评分和原话，请继续补充上医记录并保存。');
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-self-action]');if(!b)return;e.preventDefault();
 if(selfBusy||busy){notify('正在处理，请稍候。');return;}
 if(!currentCase||b.dataset.selfCase!==currentCase.id){notify('档案正在切换，请稍后再试。');return;}
 const action=b.dataset.selfAction;
 if(action==='apply'){applySelfResponse(b.dataset.responseId);return;}
 if(action==='refresh'&&dirty){notify('请先保存当前上医记录，再刷新客户反馈。');return;}
 if(action==='renew'&&!confirm('重新生成本节点链接后，旧链接将停用；已经收到的客户自评会保留。确定重新邀请吗？'))return;
 if(action==='revoke'&&!confirm('停用后，客户不能再用当前链接提交。已有自评记录保留。确定停用吗？'))return;
 const feedback=beginLoading({title:action==='refresh'?'正在刷新客户反馈':'正在处理自评链接',button:b});selfBusy=true;b.disabled=true;
 try{if(action==='refresh'){await render();notify(selfLoadError?'客户自评暂未载入，请稍后再试。':'客户反馈已刷新');}else await showSelfLink(b.dataset.selfStage,action==='copy'?'get':action);}
 catch(error){notify(/42501|self_link_not_allowed/.test(error.code+' '+error.message)?'请确认档案已获本人记录授权，并由建档人发送链接。':'自评链接暂未生成，请稍后重试。');}
 finally{feedback.finish();selfBusy=false;b.disabled=false;}
});

// Scheduling changes have their own version and history, independent of observation edits.
document.addEventListener('click',async e=>{
 const button=e.target.closest('[data-action]');if(!button||busy)return;
 if(button.dataset.action==='suggest-next-date'){
  const f=button.closest('form'),d=f.elements.actual_date.value;
  if(d){f.elements.nextDate.value=addDays(d,Number(button.dataset.gap));f.elements.nextDate.dataset.dateTouched='true';dirty=true;updateObservationProgress();}return;
 }
 if(!['service-reschedule','service-extend','service-sync'].includes(button.dataset.action)||!currentCase)return;
 syncFormDirty();if(dirty){notify('请先保存当前观察记录，再调整服务进度。');return;}
 openServiceProgress(button.dataset.action==='service-extend'?'extend':'reschedule',button.dataset.action==='service-sync'?syncSuggestion(currentCase,obs)?.date:null);
});
function openServiceProgress(action,suggestedDate=null){
 const c=currentCase;if(!demo&&c.owner_id!==user?.id)return;
 openProgress(c,obs,action,{
  dialog,suggestedDate,
  save:async payload=>{busy=true;try{return await withLoading({theme:'save',title:'正在保存服务安排'},async()=>demo?demoProgress(c,obs,payload):checkResult(await db.rpc('manage_case_service',payload)));}finally{busy=false;}},
  onSaved:async(result,payload)=>{
   c.progress=result;document.querySelector('#dialog').close();if(!demo)await refresh();dirty=false;
   if(payload.p_action==='extend'){
    const stage=payload.p_stage;
    stageMemory.set(c.id,stage);history.replaceState(null,'','#/case/'+c.id+'?stage='+stage);
    await render();
    showStageArrival(c.id,stage,'已新增回访，已进入'+stageName(stage)+'。');
   }else{
    await render();notify('服务进度已保存，待跟进日期同步更新');
   }
  }
 });
}
function focusObservationArea(element){
 if(!element)return;
 requestAnimationFrame(()=>{
  if(!element.isConnected)return;
  element.focus({preventScroll:true});
  element.scrollIntoView({block:'start',behavior:'instant'});
 });
}
root.addEventListener('click',event=>{
 if(event.target.closest('[data-observation-save-jump]'))focusObservationArea(root.querySelector('#observation-save'));
});
function showStageArrival(caseId,stage,message){
 if(currentCase?.id!==caseId||activeStage!==stage||cleanHash()!=='/case/'+caseId+'?stage='+stage)return;
 const arrival=root.querySelector('#stage-arrival');
 if(!arrival)return;
 arrival.hidden=false;
 arrival.textContent=message;
 focusObservationArea(arrival);
}
async function advanceService(c,record){
 const next=stageDays(c,obs).find(n=>n>Number(record.stage.slice(1)));
 if(next){
  const stage='d'+next;
  stageMemory.set(c.id,stage);history.replaceState(null,'','#/case/'+c.id+'?stage='+stage);
  await render();
  showStageArrival(c.id,stage,stageName(record.stage)+'已提交，已进入'+stageName(stage)+'。');
 }
 else{history.replaceState(null,'','#/case/'+c.id+'?stage='+record.stage);await render();openServiceProgress('extend');}
}

installFormValidation();
