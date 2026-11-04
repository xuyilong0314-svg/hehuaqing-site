import {createSharedClient,TeamApi,accountUrl,friendly} from './shared-auth.js';
import {isInTrash,visibleRecords,trashEntries,canManageRecord} from './record-state.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=[
 ['org','组织','把人、时间和交接安排好','活动排期、主持与跨岗协调；培养能带场的人。'],
 ['education','教育','把内容讲清，把伙伴教会','备课、试讲、教学训练与中心课件；培养主讲人。'],
 ['publicity','宣传','把共同理念与真实故事讲明白','学习内容、通知与分享训练；公开个人故事先经本人确认。'],
 ['market','市场发展','把真实问题带回来，把实践接下去','一线问题、沟通示范与实践带教；培养能带新人的骨干。'],
 ['tech','技术','让资料找得到，让现场用得上','文件版本、音响投屏、试播与备份；培养替补操作伙伴。'],
 ['support','保障','把现场照顾好，把伙伴放在心上','场地、接待、物资与收场；按本人意愿安排生日和关怀。']
];
const label={queued:'待接下',active:'进行中',submitted:'待接手',done:'已完成',pending:'待确认',confirmed:'已确认',returned:'请补充'};
const actions={initialize:'启用团队',join:'申请加入',member_assign:'确认岗位',member_pause:'调整成员状态',leave:'退出团队',project:'发起项目',thread:'提出问题',reply:'回应讨论',decision:'提出决定',decide:'确认决定',task:'安排分工',accept:'接下任务',submit:'交付成果',receive:'确认接手',return:'请补充成果',reassign:'重新安排分工',review:'记录复盘',material:'登记资料说明',record_delete:'移入回收站',record_restore:'从回收站恢复'};
let client,api,user=null,context=null,data={members:[],records:[],audit:[]},loading=true,busy=false,refreshing=false,error='',lastSync='',timer,authEpoch=0,refreshDone=Promise.resolve();
const me=()=>context?.membership,active=()=>me()?.status==='active',owner=()=>me()?.is_owner===true;
const items=k=>visibleRecords(data.records,k),byId=id=>data.records.find(r=>r.id===id),person=id=>data.members.find(m=>m.user_id===id)?.display_name||(id===user?.id?me()?.display_name:'已离开或未载入的伙伴');
const memberOptions=(selected='',allowed=null)=>data.members.filter(m=>m.status==='active'&&(!allowed||allowed.includes(m.user_id))).map(m=>`<option value="${m.user_id}" ${m.user_id===selected?'selected':''}>${esc(m.display_name)}${m.roles.length?' · '+m.roles.map(r=>roles.find(x=>x[0]===r)?.[1]).join('、'):m.is_owner?' · 负责人':''}</option>`).join('');
const btn=(text,action,id='',kind='')=>`<button type="button" class="btn ${kind}" data-action="${action}" data-id="${esc(id)}" aria-label="${esc(text)}">${text}</button>`;
const field=(title,name,value='',type='text',max=100)=>`<label class="field">${title}<input name="${name}" type="${type}" value="${esc(value)}" required maxlength="${max}"></label>`;
const area=(title,name,value='')=>`<label class="field">${title}<textarea name="${name}" required maxlength="2400">${esc(value)}</textarea></label>`;
const select=(title,name,value='',allowed=null)=>`<label class="field">${title}<select name="${name}" required><option value="">请选择一位伙伴</option>${memberOptions(value,allowed)}</select></label>`;
const pill=text=>`<span class="org-pill neutral">${esc(text)}</span>`;
const link=id=>'#/project?id='+id;
const manageable=r=>canManageRecord(r,data.records,me(),user?.id);
const trashLink=(pid='')=>'<a class="text-btn trash-link" href="#/trash'+(pid?'?project='+pid:'')+'">回收站'+(trashEntries(data.records).filter(r=>!pid||r.project_id===pid).length?'（'+trashEntries(data.records).filter(r=>!pid||r.project_id===pid).length+'）':'')+'</a>';
const moreMenu=r=>manageable(r)?'<details class="record-options"><summary>更多</summary><div class="record-options-menu">'+btn(r.kind==='project'?'删除项目':'删除任务','delete-record',r.id,'danger-link')+'</div></details>':'';
const time=t=>t?new Date(t).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'';
const pendingMembers=()=>owner()?data.members.filter(m=>m.status==='pending'):[];
const pendingThreads=()=>items('thread').filter(t=>t.details.ask===user?.id&&!items('reply').some(r=>r.thread_id===t.id&&r.created_by===user?.id));
const path=()=>new URL(location.hash.slice(1)||'/team',location.origin);
const nav=[['/team','总览','◎'],['/projects','协作','↗'],['/committees','委员会','六'],['/materials','资料','册'],['/me','我的','人']];
function brand(){return '<a class="brand" href="#/team"><span class="seal">行</span><span><span class="brand-name">天行健</span><span class="brand-sub">曜诚 · 泉州</span></span></a>';}
function bar(){return '<nav class="connected-bar" aria-label="网站导航"><a class="site-home-link" href="/#home"><span aria-hidden="true">←</span>返回网站首页</a><span>天行健-曜诚（泉州） · 团队工作台</span></nav>';}
function notice(){return error?`<div class="connection-alert" role="alert">${esc(error)} ${btn('重试连接','refresh','','secondary small-btn')}</div>`:'';}
function shell(content,route='/team'){return `<div class="connected-shell">${bar()}<div class="app-layout org-layout"><aside class="sidebar">${brand()}<div class="workspace-label">组织协作工作台</div><nav class="sidebar-nav" aria-label="团队导航">${nav.map(([p,n,i])=>`<a href="#${p}" class="${route===p?'active':''}"><span>${i}</span>${n}</a>`).join('')}</nav><div class="council-entry"><a href="#/decisions">班子议事</a><p>把问题说开，把下一步定下来。</p></div><div class="sidebar-bottom"><a href="${accountUrl(location)}">进入古中医 ↗</a><a href="#/me">我的账号与岗位</a>${trashLink()}</div></aside><main id="main" class="workspace org-workspace"><header class="workspace-top"><strong>天行健-曜诚（泉州）</strong><div class="flex"><button class="sync-btn" data-action="refresh">刷新进展</button><a class="org-persona" href="#/me">${esc(me()?.display_name||'伙伴')}${owner()?' · 负责人':''}</a></div></header>${notice()}${content}<footer class="org-footer">${lastSync?'最近同步 '+esc(time(lastSync)):'正在同步'} · 每件事一人牵头，做完有人接</footer></main><nav class="mobile-nav" aria-label="手机团队导航">${nav.map(([p,n,i])=>`<a href="#${p}" class="${route===p?'active':''}"><span>${i}</span><span>${n}</span></a>`).join('')}</nav></div></div>`;}
function gate(content){return `<div class="connected-shell">${bar()}<header class="site-header">${brand()}<a class="text-btn" href="${accountUrl(location)}">全站账号 ↗</a></header><main id="main" class="auth-main"><section class="auth-art"><div><div class="eyebrow">从井冈山出发</div><h2>共同做事，<br>一起担当。</h2></div><div class="art-bottom"><div class="art-line"></div>实事求是 · 互助同行<br>把所学变成行动，把方法教给伙伴。</div></section><section class="auth-form-wrap">${notice()}${content}</section></main></div>`;}
function login(){return gate(`<h1>登录团队工作台</h1><p class="intro">使用全站通用账号。<br>在古中医注册过，可直接登录。</p><form id="login-form">${field('邮箱','email','','email',254)}${field('密码','password','','password',200)}<div class="form-status" role="alert"></div><button class="btn full" type="submit">登录</button></form><div class="auth-help"><a class="text-btn" href="${accountUrl(location)}">注册账号 / 找回密码 ↗</a></div><p class="auth-note">新伙伴登录后申请加入，由负责人确认岗位。注册和找回密码在全站账号页办理。</p>`);}
function membership(){const m=me();let c=`<h1>加入共同的工作</h1><p class="intro">您好，${esc(m?.display_name||user?.user_metadata?.display_name||'伙伴')}。<br>您的全站账号已登录。</p>`;
 if(context?.can_initialize)c+=`<div class="bootstrap"><strong>首次启用</strong><p class="minor">您是网站管理员。确认启用后，您将成为这个工作台的首位负责人，再确认其他伙伴与岗位。</p><form data-command="initialize">${field('团队中的姓名','name',user?.user_metadata?.display_name||'')}<div class="form-status" role="alert"></div><button class="btn" type="submit">确认由我启用工作台</button></form></div>`;
 if(m?.status==='pending')c+='<div class="focus-note"><strong>申请已收到</strong><p>等待团队负责人确认。确认后即可看见共同项目与岗位安排。</p></div>'+btn('查看进展','refresh','','secondary');
 else c+=`<form data-command="join">${field('团队中的姓名','name',m?.display_name||user?.user_metadata?.display_name||'')}<label class="check-field"><input type="checkbox" required>我愿意加入团队，并按约定参与共同工作。</label><div class="form-status" role="alert"></div><button class="btn full" type="submit">${m?.status==='left'?'重新申请加入':'申请加入'}</button></form>`;
 return gate(c+'<p class="auth-note">团队岗位与古中医教学、健康档案权限分别确认。</p>'+btn('退出登录','logout','','secondary small-btn'));}
function empty(title,body,button=''){return `<div class="connected-empty"><h2>${title}</h2><p>${body}</p>${button}</div>`;}
function projectRow(p){const ts=items('task').filter(t=>t.project_id===p.id);return `<a class="project-row" href="${link(p.id)}"><div class="grow"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="project-meta"><span>${esc(person(p.details.lead))}牵头</span><span>${esc(p.details.due)}交付</span><span>${ts.filter(t=>t.details.status==='done').length} / ${ts.length} 项已交接</span></div></div><span>↗</span></a>`;}
function mine(){return items('task').filter(t=>(t.details.owner===user.id&&['queued','active'].includes(t.details.status))||(t.details.receiver===user.id&&t.details.status==='submitted'));}
function recordRow(r){const task=r.kind==='task',d=r.details;return `<button class="record-button" data-action="detail" data-id="${r.id}"><div class="flex between wrap"><h3>${esc(r.title||'工作复盘')}</h3>${d.status?pill(label[d.status]||d.status):''}</div><p>${esc(task?d.criteria:r.body)}</p><div class="record-meta">${task?esc(person(d.owner))+' → '+esc(person(d.receiver))+' · '+esc(d.due):esc(person(r.created_by))+' · '+time(r.created_at)}</div></button>`;}
function home(){const needed=items('decision').filter(d=>d.details.decider===user.id&&d.details.status==='pending');return shell(`<section class="org-banner"><div><div class="eyebrow">实事求是 · 互助同行</div><h1>围绕同一件事，<br class="mobile-break">把六岗连在一起。</h1><p>问题一起讲清，工作各自接下，结果共同检验。</p></div>${btn('发起共同项目','new-project','','light')}</section><div class="org-summary"><div><b>${items('project').length}</b><span>共同项目</span></div><div><b>${mine().length+needed.length+pendingThreads().length+pendingMembers().length}</b><span>等我处理</span></div><div><b>${data.members.filter(m=>m.status==='active').length}</b><span>共同工作的伙伴</span></div></div>${pendingMembers().length?'<div class="focus-note"><a class="text-btn" href="#/members">有 '+pendingMembers().length+' 位新伙伴等待您确认加入与岗位 ↗</a></div>':''}<div class="org-columns"><section><div class="section-head"><h2>共同推进的事</h2><a class="text-btn" href="#/projects">查看全部 ↗</a></div>${items('project').map(projectRow).join('')||empty('从一件真实工作开始','约好要解决的问题、牵头人和交付日期。大家的讨论、分工与成果都留在同一处。',btn('发起第一个项目','new-project'))}</section><aside><div class="section-head"><h2>等我处理</h2></div><div class="records-list">${[...needed,...pendingThreads(),...mine()].map(recordRow).join('')||'<div class="org-empty">讨论、决定与交接暂时没有待办。<br>可以看看共同项目，或向伙伴提出问题。</div>'}</div></aside></div><div class="org-section-heading"><h2>六岗，一起做事</h2><a class="text-btn" href="#/committees">查看职责与伙伴 ↗</a></div><div class="committee-strip">${roles.map(([id,n])=>`<a href="#/committees?role=${id}"><span>${n.slice(0,1)}</span><b>${n}</b><small>${data.members.filter(m=>m.status==='active'&&m.roles.includes(id)).length} 位伙伴</small></a>`).join('')}</div>`);}
function projects(){return shell(`<div class="org-page-heading"><div><h1>共同项目</h1><p>从一个真实问题开始，做到伙伴能接着用。</p></div><div class="project-list-actions">${trashLink()}${btn('发起项目','new-project')}</div></div>${items('project').map(projectRow).join('')||empty('还没有共同项目','先从下一场迎新会、一次伙伴试讲，或一份课件的交接开始。',btn('发起项目','new-project'))}`,'/projects');}
function projectView(id,tab){const p=byId(id);if(!p||p.kind!=='project')return shell(empty('没有找到这项工作','可能是链接有误，或您目前没有查看权限。<a href="#/projects">返回共同项目</a>'),'/projects');
 if(isInTrash(p,data.records))return shell('<a class="page-breadcrumb" href="#/projects">← 共同项目</a><div class="org-page-heading"><div><h1>'+esc(p.title)+'</h1><p>这个项目已移入回收站，原来的讨论与交付记录仍保留。</p></div></div>'+trashRecord(p),'/projects');
 const tabs=[['overview','概况'],['thread','讨论'],['task','分工'],['decision','决定'],['review','复盘']];if(!tabs.some(x=>x[0]===tab))tab='overview';
 const list=items(tab).filter(r=>r.project_id===id),lead=owner()||p.details.lead===user.id;
 const head=`<a class="page-breadcrumb" href="#/projects">← 共同项目</a><div class="org-page-heading project-heading"><div><h1>${esc(p.title)}</h1><p>${esc(person(p.details.lead))}牵头 · ${esc(p.details.due)}交付</p></div>${moreMenu(p)}</div><nav class="project-tabs">${tabs.map(([key,name])=>`<a href="${link(id)}&tab=${key}" class="${key===tab?'active':''}">${name}</a>`).join('')}</nav>`;
 let body;
 if(tab==='overview')body=`<div class="project-overview"><section><div class="brief-line"><span>要解决什么</span><p>${esc(p.body)}</p></div><div class="brief-line"><span>做到什么样</span><p>${esc(p.details.outcome)}</p></div><div class="project-actions">${btn('提出问题','new-thread',id)}${lead?btn('安排分工','new-task',id,'secondary'):''}${btn('记录复盘','new-review',id,'secondary')}</div><h2>最近的讨论</h2><div class="records-list">${items('thread').filter(r=>r.project_id===id).slice(-3).map(recordRow).join('')||'<p class="org-empty">把需要配合的问题放到这里，相关伙伴可直接回应。</p>'}</div></section><aside class="project-side"><h2>交接进展</h2><div class="records-list">${items('task').filter(r=>r.project_id===id).map(recordRow).join('')||'<p>先把目标讲清，再安排到具体的人。</p>'}</div></aside></div>`;
 else body=`<div class="project-actions">${tab==='task'?trashLink(id):''}${tab==='thread'?btn('提出问题','new-thread',id):tab==='task'&&lead?btn('安排分工','new-task',id):tab==='review'?btn('记录复盘','new-review',id):''}</div><div class="records-list">${list.map(recordRow).join('')||'<div class="org-empty">'+(tab==='decision'?'在讨论详情中提出需要确认的决定。':'还没有记录。')+'</div>'}</div>`;
 return shell(head+'<section class="project-content">'+body+'</section>','/projects');
}
function committees(){const choose=path().searchParams.get('role');return shell(`<div class="org-page-heading"><div><h1>六个委员会</h1><p>各有分工，围绕共同项目配合。</p></div>${owner()?'<a href="#/members" class="btn">确认成员与岗位</a>':''}</div>${roles.filter(r=>!choose||r[0]===choose).map(([id,n,purpose,duty])=>`<section class="committee-entry"><div class="committee-seal">${n.slice(0,1)}</div><div class="grow"><h2>${n}委员会</h2><p>${purpose}</p><p>${duty}</p><small>当前伙伴：${data.members.filter(m=>m.status==='active'&&m.roles.includes(id)).map(m=>esc(m.display_name)).join('、')||'等待确认'}</small></div></section>`).join('')}<p class="focus-note">需要别的岗位配合时，在共同项目里提出问题、选好回应的人；重要安排留一条决定，交付之后请接手人检查。</p>`,'/committees');}
function members(){if(!owner())return shell(empty('请由负责人确认岗位','您可以在“我的”查看自己的岗位。'),'/committees');return shell(`<div class="org-page-heading"><div><h1>成员与岗位</h1><p>先谈清意愿与分工，再在这里确认。一个人可以参与多个岗位。</p></div></div>${data.members.map(m=>`<article class="member-row"><div><h3>${esc(m.display_name)} ${pill(m.is_owner?'负责人':m.status==='pending'?'待确认':m.status==='left'?'已退出':'已加入')}</h3><p>${m.roles.map(r=>roles.find(x=>x[0]===r)?.[1]).join('、')||'尚未安排六岗职责'}</p></div>${!m.is_owner&&m.status!=='left'?btn(m.status==='pending'?'确认加入与岗位':'调整岗位','assign',m.user_id,'secondary small-btn'):''}</article>`).join('')}`,'/committees');}
function mePage(){const m=me();return shell(`<div class="org-page-heading"><div><h1>${esc(m.display_name)}</h1><p>${owner()?'团队负责人':m.roles.map(r=>roles.find(x=>x[0]===r)?.[1]).join('、')||'已加入团队 · 岗位待安排'}</p></div></div><h2>等我处理的工作</h2><div class="records-list">${[...items('decision').filter(d=>d.details.decider===user.id&&d.details.status==='pending'),...pendingThreads(),...mine()].map(recordRow).join('')||'<p class="org-empty">目前没有待处理的任务。</p>'}</div><section class="member-overview"><h2>账号与团队</h2><p class="space-top">${esc(user.email||'已登录全站账号')}</p><p class="minor">全站共用同一账号。团队岗位、古中医教学和健康档案权限分别管理。</p><div class="actions space-top"><a class="btn secondary" href="${accountUrl(location)}">全站账号 ↗</a>${trashLink()}${btn('退出登录','logout','','secondary')}${!owner()?btn('申请退出团队','leave','','secondary'):''}</div></section><section class="inline-section"><h2>最近的工作记录</h2>${data.audit.slice(0,12).map(e=>`<div class="audit-line"><span>${time(e.created_at)}</span><div><span>${esc(person(e.actor))} · ${esc(actions[e.action]||'更新工作')}</span>${e.details?.title?'<p class="audit-title">'+esc(e.details.title)+'</p>':''}${e.details?.reason?'<p class="minor">原因：'+esc(e.details.reason)+'</p>':''}</div></div>`).join('')}</section>`,'/me');}
function trashRecord(r){const parent=byId(r.project_id),hiddenParent=parent?.deleted_at;return `<article class="trash-record"><div class="trash-record-head"><div><span class="trash-kind">${r.kind==='project'?'共同项目':'具体任务'}</span><h2>${esc(r.title)}</h2></div>${pill('已删除')}</div><p class="trash-reason">${esc(r.delete_reason)}</p><p class="record-meta">${esc(person(r.deleted_by))} · ${time(r.deleted_at)} 移入回收站${parent?' · 来自 '+esc(parent.title):''}</p><div class="trash-record-actions">${r.kind==='task'?btn('查看原记录','detail',r.id,'secondary small-btn'):''}${manageable(r)&&!hiddenParent?btn(r.kind==='project'?'恢复项目':'恢复任务','restore-record',r.id,'secondary small-btn'):''}${!manageable(r)?'<span class="minor">由项目牵头人或团队负责人恢复</span>':''}</div></article>`;}
function trashPage(){const pid=path().searchParams.get('project'),p=byId(pid),entries=trashEntries(data.records).filter(r=>!pid||r.project_id===pid||r.id===pid);return shell(`<a class="page-breadcrumb" href="${pid?link(pid)+'&tab=task':'#/projects'}">← ${pid?'返回项目分工':'共同项目'}</a><div class="org-page-heading"><div><div class="eyebrow">工作记录，妥善留存</div><h1>回收站</h1><p>${pid&&p?esc(p.title)+' · ':''}误删可以恢复，原来的内容和进度会保留。</p></div>${pid?'<a class="text-btn" href="#/trash">查看全部回收记录 ↗</a>':''}</div><div class="trash-list">${entries.map(trashRecord).join('')||empty('回收站是空的','删除的项目与任务会放在这里。')}</div><p class="trash-footnote">项目恢复后，之前单独删除的任务仍留在回收站。删除与恢复均保留操作记录。</p>`,'/projects');}
function materials(){return shell(`<div class="org-page-heading"><div><h1>中心资料</h1><p>围绕共同项目，先把资料名称、版本与用途说清。</p></div>${(owner()||me().roles.some(r=>['education','tech'].includes(r)))?btn('登记资料说明','new-material'):''}</div><div class="records-list">${items('material').map(recordRow).join('')||empty('等待整理第一份资料','教育、技术或负责人可先登记材料说明。正式文件上传、版本审批与分发将在下一轮接入。')}</div>`,'/materials');}
function render(){document.title='天行健-曜诚（泉州）· 团队工作台';if(loading){$('#app').innerHTML=gate('<h1>正在连接…</h1><p class="intro">核对账号与团队身份。</p>');return;}
 if(!user){$('#app').innerHTML=login();return;}
 if(!context){$('#app').innerHTML=gate('<h1>暂未连接成功</h1><p class="intro">请重试连接。您的账号与输入不会作为演示数据处理。</p>'+btn('重试连接','refresh')+btn('退出登录','logout','','secondary'));return;}
 if(!active()){$('#app').innerHTML=membership();return;}
 const url=path(),r=url.pathname;
 $('#app').innerHTML=r==='/trash'?trashPage():r==='/projects'?projects():r==='/project'?projectView(url.searchParams.get('id'),url.searchParams.get('tab')):r==='/committees'?committees():r==='/members'?members():r==='/materials'?materials():r==='/me'?mePage():r==='/decisions'?shell('<div class="org-page-heading"><div><h1>需要确认的决定</h1><p>保留讨论依据，由指定的人确认。</p></div></div><div class="records-list">'+(items('decision').map(recordRow).join('')||'<p class="org-empty">目前没有需要确认的决定。</p>')+'</div>','/committees'):home();
}
let modalFocus;
function close(){const d=$('dialog');if(d)d.close();$('#modal-root').innerHTML='';document.body.classList.remove('modal-root-open');modalFocus?.focus();}
function modal(title,html){if($('dialog'))close();modalFocus=document.activeElement;$('#modal-root').innerHTML=`<dialog class="modal live-dialog" aria-labelledby="dialog-title"><button class="modal-close" data-action="close" aria-label="关闭">×</button><h2 id="dialog-title">${esc(title)}</h2>${html}</dialog>`;const d=$('dialog');d.addEventListener('cancel',e=>{if(busy)e.preventDefault();else close();});d.showModal();document.body.classList.add('modal-root-open');}
function form(action,content,attrs='',submit='保存'){return `<form data-command="${action}" ${attrs}>${content}<div class="form-status" role="alert"></div><div class="actions">${btn('取消','close','','secondary')}<button class="btn" type="submit">${submit}</button></div></form>`;}
function detail(id){const r=byId(id);if(!r){toast('记录已改变，请刷新。');return;}const d=r.details,p=byId(r.project_id);let content=`<div class="record-meta">${esc(person(r.created_by))} · ${time(r.created_at)}${d.status?' · '+esc(label[d.status]):''}</div>`;
 if(r.body)content+=`<p class="record-body space-top">${esc(r.body)}</p>`;
 if(r.kind==='thread'){
  content+=`<p class="minor space-top">请 ${esc(person(d.ask))} 回应</p><div class="thread-tools">${btn('提出一个决定','new-decision',id,'secondary small-btn')}</div>${items('reply').filter(x=>x.thread_id===id).map(x=>`<div class="reply-record"><small>${esc(person(x.created_by))} · ${time(x.created_at)}</small><p class="record-body">${esc(x.body)}</p></div>`).join('')}${form('reply',area('补充说明 / 回应','body'),`data-record="${id}"`,'保存回应')}`;
 }else if(r.kind==='task'){
  content+=`<div class="record-details"><dl><dt>由谁完成</dt><dd>${esc(person(d.owner))}</dd><dt>交给谁检查</dt><dd>${esc(person(d.receiver))}</dd><dt>何时交付</dt><dd>${esc(d.due)}</dd><dt>完成标准</dt><dd>${esc(d.criteria)}</dd>${d.deliverable?'<dt>交付说明</dt><dd>'+esc(d.deliverable)+'</dd>':''}${d.feedback?'<dt>接手反馈</dt><dd>'+esc(d.feedback)+'</dd>':''}</dl></div>`;
  if(isInTrash(r,data.records)){const parentDeleted=p?.deleted_at;content+='<div class="trash-notice"><strong>'+(parentDeleted?'所在项目已删除':'这项任务已删除')+'</strong><p>'+esc(parentDeleted?p.delete_reason:r.delete_reason)+'</p><p>原来的交付与反馈仍保留，恢复后可继续处理。</p></div>';if(parentDeleted)content+='<a class="text-btn" href="'+link(p.id)+'">查看所在项目 ↗</a>';else if(manageable(r))content+=btn('恢复任务','restore-record',r.id,'secondary');modal(r.title,content);return;}
  if(d.decision)content+=btn('查看相关决定','detail',d.decision,'secondary small-btn');
  const attrs=`data-record="${id}" data-version="${r.version}"`;
  if(d.owner===user.id&&d.status==='queued')content+=form('accept','<p>接下后，请按约定完成，并把可用的成果交给接手人。</p>',attrs,'我接下这项工作');
  if(d.owner===user.id&&d.status==='active')content+=form('submit',area('做完了什么，成果在哪里','deliverable',d.deliverable||''),attrs,'交付给接手人');
  if(d.receiver===user.id&&d.status==='submitted')content+=form('receive',area('检查结果','feedback')+'<label class="field">接手结果<select name="result"><option value="receive">检查通过，确认接手</option><option value="return">仍有缺项，请对方补充</option></select></label>',attrs,'提交检查结果');
  if((owner()||p?.details.lead===user.id)&&d.status!=='done')content+=btn('调整承担人与接手人','reassign',id,'secondary small-btn');
  content+='<div class="task-secondary-actions">'+moreMenu(r)+'</div>';
 }else if(r.kind==='decision'){
  if(r.thread_id)content+=btn('查看讨论依据','detail',r.thread_id,'secondary small-btn');
  content+=`<p class="space-top">决定人：${esc(person(d.decider))}</p>`;
  if(d.rationale)content+=`<div class="focus-note"><strong>决定依据</strong><p>${esc(d.rationale)}</p></div>`;
  if(d.status==='pending'&&d.decider===user.id)content+=form('decide',area('为什么这样决定','rationale')+'<label class="field">处理结果<select name="status"><option value="confirmed">确认，按此推进</option><option value="returned">请补充后再议</option></select></label>',`data-record="${id}" data-version="${r.version}"`,'记录决定');
  if(d.status==='confirmed'&&(owner()||p?.details.lead===user.id))content+=btn('按这个决定安排分工','decision-task',id);
 }else if(r.kind==='review'){content+=`<h3>下次改什么</h3><p class="record-body">${esc(d.change)}</p><h3>接下来怎么做</h3><p class="record-body">${esc(d.next)}</p>`;}
 else if(r.kind==='material'){content+=`<p class="space-top">版本：${esc(d.edition)}</p><p class="auth-note">当前为资料说明，不含文件上传或分发。</p>`;}
 modal(r.title||'这次工作的复盘',content);
}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
async function refresh({silent=false}={}){
 if(refreshing){await refreshDone;return refresh({silent});}
 if(!user)return;
 refreshing=true;const epoch=authEpoch;let release;refreshDone=new Promise(resolve=>release=resolve);
 try{
  const c=await api.context();if(epoch!==authEpoch)return;
  let snapshot={members:[],records:[],audit:[]};
  if(c.membership?.status==='active')snapshot=await api.snapshot(c.team.id);
  if(epoch!==authEpoch)return;
  const changed=JSON.stringify(data.records)!==JSON.stringify(snapshot.records)||JSON.stringify(context)!==JSON.stringify(c)||JSON.stringify(data.members)!==JSON.stringify(snapshot.members);
  const hadError=Boolean(error);context=c;data=snapshot;error='';lastSync=snapshot.server_time||new Date().toISOString();
  if(!active())close();
  if(!silent||changed||hadError)render();
 }catch(e){if(epoch!==authEpoch)return;error=friendly(e);
  if(e.message?.includes('member_required')||e.code==='42501'){context=null;data={members:[],records:[],audit:[]};close();}
  if(!silent)render();else{const alert=$('.connection-alert');if(!alert){const top=$('.workspace-top');top?.insertAdjacentHTML('afterend',notice());}}
 }finally{refreshing=false;release();}
}
async function authChanged(session){const epoch=++authEpoch;user=session?.user||null;context=null;data={members:[],records:[],audit:[]};loading=Boolean(user);close();render();if(user){await refresh();if(epoch===authEpoch){loading=false;render();}}}
document.addEventListener('click',async e=>{
 if(e.target.closest('.skip-link')){e.preventDefault();const main=$('#main');main?.setAttribute('tabindex','-1');main?.focus();main?.scrollIntoView();return;}
 const b=e.target.closest('[data-action]');if(!b)return;const act=b.dataset.action,id=b.dataset.id;
 if(act==='close'){if(!busy)close();return;}
 if(act==='refresh'){if(user)await refresh();else{error='';render();}return;}
 if(act==='logout'){if(busy)return;const r=await client.auth.signOut();if(r.error)toast(friendly(r.error));return;}
 if(!active())return;
 if(act==='detail'){detail(id);return;}
 if(act==='delete-record'||act==='restore-record'){
  const r=byId(id);if(!manageable(r)){toast('请由项目牵头人或团队负责人处理。');return;}
  const restoring=act==='restore-record',isProject=r.kind==='project',noun=isProject?'项目':'任务',parent=byId(r.project_id);
  if(parent?.deleted_at){toast('请先从回收站恢复所在项目。');return;}
  if(restoring!==Boolean(r.deleted_at)){toast('记录已改变，请刷新后查看。');return;}
  const scope=isProject?'整个项目会从当前工作中移走，讨论、分工和交付记录都会保留。':'任务会从待办与项目进度中移走，交付记录仍保留。';
  const info=`<div class="trash-confirm-title">${esc(r.title)}</div><p class="record-body">${restoring?'恢复后回到原来的项目与进度。':scope}</p>${restoring&&isProject?'<p class="minor space-top">之前单独删除的任务仍留在回收站。</p>':''}`;
  const fields=restoring?'':`<label class="field">删除原因<textarea name="reason" required maxlength="500" placeholder="例如：建重复了，或这项工作已取消。"></textarea></label><p class="minor">删除后可到「协作 → 回收站」恢复。</p>`;
  modal((restoring?'恢复':'删除')+noun,form(restoring?'record_restore':'record_delete',info+fields,`data-record="${id}" data-version="${r.version}"`,restoring?'确认恢复':'移入回收站'));return;
 }
 if(act==='new-project'){modal('发起一件共同工作',form('project',field('项目名称','title')+area('要解决什么问题','body')+area('做到什么样算完成','outcome')+select('谁来牵头','lead',user.id)+field('约定交付日期','due','','date'),'','发起项目'));return;}
 if(act==='new-thread'){modal('把需要配合的问题讲清楚',form('thread',field('一句话说明主题','title')+area('现在的情况，需要什么配合','body')+select('请谁回应','ask'),`data-project="${id}"`,'发到共同讨论'));return;}
 if(act==='new-review'){modal('留下这次的经验',form('review',area('这次做好的事','body')+area('下次改什么','change')+area('接下来怎么做','next'),`data-project="${id}"`,'记录复盘'));return;}
 if(act==='new-decision'){const t=byId(id);modal('提出一个需要确认的决定',form('decision',field('要决定什么','title',t.title)+area('建议怎么做，依据是什么','body')+select('由谁确认','decider','',data.members.filter(m=>m.is_owner||m.user_id===byId(t.project_id).details.lead).map(m=>m.user_id)),`data-project="${t.project_id}" data-source="${id}"`,'提交待确认'));return;}
 if(act==='new-task'||act==='decision-task'){const d=act==='decision-task'?byId(id):null,pid=d?.project_id||id;modal('把工作交到具体的人',form('task',field('要完成什么','title',d?.title||'')+select('承担人','owner')+select('接手检查的人','receiver')+field('约定交付日期','due','','date')+area('做到什么样，对方才能用','criteria'),`data-project="${pid}" ${d?'data-decision="'+d.id+'"':''}`,'安排分工'));return;}
 if(act==='reassign'){const t=byId(id);if(isInTrash(t,data.records)){toast('请先恢复这项任务。');return;}modal('重新说清这项分工',form('reassign',select('承担人','owner',t.details.owner)+select('接手人','receiver',t.details.receiver)+area('调整原因','reason'),`data-record="${id}" data-version="${t.version}"`,'确认调整'));return;}
 if(act==='assign'){const m=data.members.find(x=>x.user_id===id);modal('确认 '+m.display_name+' 的岗位',form('member_assign',`<p>请先与本人谈清安排。可参与多个岗位，也可先加入、再确认岗位。</p><div class="role-checks">${roles.map(([k,n])=>`<label><input name="roles" type="checkbox" value="${k}" ${m.roles.includes(k)?'checked':''}>${n}</label>`).join('')}</div>`,`data-user="${id}" data-version="${m.version}"`,'确认安排'));return;}
 if(act==='leave'){modal('退出当前团队',form('leave','<p>退出后将不再查看团队内部工作。已经留下的工作记录保留，方便其他伙伴继续接手。您的全站账号仍可使用。</p>'+area('需要说明或交接的事','reason'),`data-user="${user.id}" data-version="${me().version}"`,'确认退出团队'));return;}
 if(act==='new-material'){modal('登记资料说明',form('material',`<label class="field">用于哪个项目<select name="project" required><option value="">请选择</option>${items('project').map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></label>`+field('材料名称','title')+field('版本','edition','','text',40)+area('用途、来源与存放位置','body'),'','登记说明'));return;}
});
document.addEventListener('submit',async e=>{
 const f=e.target;if(!f.matches('form'))return;e.preventDefault();if(busy)return;
 const status=f.querySelector('.form-status'),buttons=f.querySelectorAll('button');status.textContent='';busy=true;buttons.forEach(b=>b.disabled=true);
 try{
  const fd=new FormData(f);
  if(f.id==='login-form'){
   const r=await client.auth.signInWithPassword({email:String(fd.get('email')).trim(),password:String(fd.get('password'))});
   if(r.error)throw r.error;return;
  }
  let action=f.dataset.command,args=Object.fromEntries(fd);
  if(!action)return;
  if(f.dataset.record)args.id=f.dataset.record;if(f.dataset.version)args.version=Number(f.dataset.version);
  if(f.dataset.project)args.project=f.dataset.project;if(f.dataset.source)args.source=f.dataset.source;
  if(f.dataset.decision)args.decision=f.dataset.decision;if(f.dataset.user)args.user=f.dataset.user;
  if(action==='member_assign')args.roles=fd.getAll('roles');
  if(action==='receive'){action=args.result;delete args.result;}
  const payload=JSON.stringify([action,args]);
  // Identical retry reuses its id, including after a lost response. Changed input is a new command.
  if(f.dataset.payload!==payload){f.dataset.payload=payload;f.dataset.request=crypto.randomUUID();}
  const result=await api.command(context.team.id,action,args,f.dataset.request);
  close();await refresh();toast(action==='record_delete'?'已移入回收站，需要时可以恢复。':action==='record_restore'?'已恢复，原来的内容与进度都在。':'已保存到共同工作记录。');
  if(action==='record_delete'&&result.kind==='project')location.hash='/projects';
  if(action==='record_restore')location.hash='/project?id='+(result.kind==='project'?result.id:result.project_id)+(result.kind==='task'?'&tab=task':'');
  if(action==='project')location.hash='/project?id='+result.id;
  else if(['reply','decide','accept','submit','receive','return','reassign'].includes(action)&&active())detail(action==='reply'?args.id:result.id);
 }catch(e){
  status.textContent=friendly(e);
  if(e.message?.includes('version_conflict'))refresh({silent:true});
 }finally{busy=false;buttons.forEach(b=>b.disabled=false);}
});
window.addEventListener('hashchange',()=>{if(!busy)close();render();window.scrollTo({top:0});});
window.addEventListener('online',()=>{if(user&&!busy)refresh({silent:true});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user&&!busy&&!$('dialog'))refresh({silent:true});});
async function start(){
 try{
  client=createSharedClient();api=new TeamApi(client);
  const r=await client.auth.getSession();if(r.error)throw r.error;await authChanged(r.data.session);
  client.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)){setTimeout(()=>{if(user?.id!==session?.user?.id||event==='SIGNED_OUT')authChanged(session);},0);}});
  setInterval(()=>{if(user&&!document.hidden&&!busy&&!$('dialog'))refresh({silent:true});},15000);
 }catch(e){loading=false;error=friendly(e);render();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

