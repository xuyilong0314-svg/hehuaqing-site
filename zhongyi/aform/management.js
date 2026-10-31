import {STAGES,esc,today,addDays,nextFollow} from './core.js';

// The caller supplies roles read from user_roles under RLS, never signup metadata.
export function accountRole(rows=[]) {
  if(rows.some(r=>r.role==='admin'))return 'admin';
  if(rows.some(r=>r.role==='teacher'))return 'teacher';
  return 'student';
}
export const roleName=role=>role==='admin'?'最高管理员':role==='teacher'?'管理成员':'学员';

export function summarize({cases=[],observations=[],photos=[],reviews=[],members=[],userId='',date=today()}) {
  const submitted=observations.filter(o=>o.status==='submitted');
  const reviewed=new Set(reviews.filter(r=>r.org_status==='organized').map(r=>r.case_id));
  const due=cases.map(c=>({record:c,next:nextFollow(c,observations)}))
    .filter(x=>x.next&&x.next.date<=date).sort((a,b)=>a.next.date.localeCompare(b.next.date));
  const recent=submitted.slice().sort((a,b)=>String(b.updated_at||b.actual_date).localeCompare(String(a.updated_at||a.actual_date))).slice(0,5);
  const week=Array.from({length:7},(_,i)=>{
    const day=addDays(date,i-6);
    return {day,count:submitted.filter(o=>o.actual_date===day).length};
  });
  return {
    total:cases.length,students:members.filter(m=>m.id!==userId).length,
    submitted:submitted.length,photos:photos.length,due,recent,week,
    teaching:cases.filter(c=>c.consent_teaching===true).length,
    reviewPending:cases.filter(c=>c.consent_teaching===true&&!reviewed.has(c.id)).length,
    deletionRequests:cases.filter(c=>c.deletion_requested===true).length,
    stages:STAGES.map(n=>({day:n,count:new Set(submitted.filter(o=>o.stage==='d'+n).map(o=>o.case_id)).size}))
  };
}

export function memberSummaries(members,cases,observations,photos,excludeId='') {
  return members.filter(m=>m.id!==excludeId).map(m=>{
    const records=cases.filter(c=>c.owner_id===m.id),ids=new Set(records.map(c=>c.id));
    return {...m,recordCount:records.length,observationCount:observations.filter(o=>ids.has(o.case_id)&&o.status==='submitted').length,
      photoCount:photos.filter(p=>ids.has(p.case_id)).length};
  }).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
}

export function archiveFilter(cases,observations,filters={}) {
  const {query='',className='',ownerId='',consent='',stage='',start='',end=''}=filters;
  const q=query.toLocaleLowerCase().trim();
  return cases.filter(c=>(!q||(String(c.name)+String(c.code)).toLocaleLowerCase().includes(q))&&
    (!className||c.class_name===className)&&(!ownerId||c.owner_id===ownerId)&&
    (!start||c.created_on>=start)&&(!end||c.created_on<=end)&&
    (consent!=='yes'||c.consent_teaching===true)&&(consent!=='no'||c.consent_teaching!==true)&&
    (consent!=='delete'||c.deletion_requested===true)&&
    (!stage||observations.some(o=>o.case_id===c.id&&o.stage===stage&&o.status==='submitted')));
}

export function managementHome({summary:s,cases,profile,role},recordRow,icon) {
  const name=profile.display_name||'管理成员';
  const metric=(title,value,unit,href,caption)=>`<a class="metric-card" href="#${href}"><span>${title}<b>↗</b></span><div><strong>${value}</strong><small>${unit}</small></div><p>${caption}</p></a>`;
  const maximum=Math.max(1,...s.week.map(d=>d.count));
  return `<section class="admin-hero"><div><div class="eyebrow">古中医阴阳五行舌 · 私人管理空间</div><h1>${esc(name)}的工作台</h1><p>看见每一份记录，连接每一次跟进。</p><span class="admin-role">${roleName(role)}</span></div><div class="hero-date"><span>${today().replaceAll('-',' / ')}</span><small>学习 · 观察 · 持续记录</small><button class="btn tiny" data-action="refresh-workspace">刷新工作台 ${icon('clock')}</button></div></section>
    <div class="management-shortcuts" aria-label="管理栏目"><a href="#/records">${icon('folder')}全部档案</a><a href="#/students">${icon('user')}学员列表</a><a href="#/library">${icon('book')}教学案例</a><a href="#/collect">${icon('export')}筛选与导出</a></div>
    <div class="metric-grid">${metric('已注册学员',s.students,'位','/students','包含尚未建立档案的学员')}${metric('观察档案',s.total,'份','/records','本人记录与服务对象档案')}${metric('已提交观察',s.submitted,'次','/collect','不包含尚未提交的草稿')}${metric('私有舌象照片',s.photos,'张','/records','在档案中查看与对比')}</div>
    <div class="management-grid"><section class="panel management-panel"><div class="section-head"><div><span class="eyebrow">FOLLOW UP</span><h2>今天需要关注</h2></div><a class="small" href="#/due">全部 ${s.due.length} 份 ↗</a></div>${s.due.length?s.due.slice(0,3).map(x=>recordRow(x.record)).join(''):'<div class="empty"><span class="empty-symbol">✓</span><h3>暂无到期的跟进</h3><p>学员建档后，会按约定日期出现在这里。</p></div>'}<div class="attention-strip"><a href="#/library"><b>${s.reviewPending}</b><span>待整理授权案例</span>↗</a><a href="#/collect?consent=delete"><b>${s.deletionRequests}</b><span>删除申请</span>↗</a></div></section>
    <section class="panel management-panel"><div class="section-head"><div><span class="eyebrow">OBSERVATIONS</span><h2>近七天观察</h2></div><span class="badge outline">按实际记录日期</span></div><div class="activity-bars" role="img" aria-label="${s.week.map(d=>d.day+'：'+d.count+'次').join('；')}">${s.week.map(d=>`<div><strong>${d.count}</strong><div class="bar-slot"><i style="height:${d.count/maximum*100}%"></i></div><span>${d.day.slice(5).replace('-','/')}</span></div>`).join('')}</div><p class="small muted mb">如实展示已提交的观察次数。</p><div class="mini-summary"><span>获教学授权的档案</span><a href="#/library">${s.teaching} 份 ↗</a></div></section></div>
    <div class="management-grid"><section class="panel management-panel"><div class="section-head"><div><span class="eyebrow">RECENT RECORDS</span><h2>最近提交</h2></div><a class="small" href="#/collect">查看全部 ↗</a></div>${s.recent.length?s.recent.map(o=>{const c=cases.find(c=>c.id===o.case_id);return c?`<a class="activity-row" href="#/case/${esc(c.id)}"><span class="activity-dot"></span><div><strong>${esc(c.name)}</strong><small>${esc(c.partner_name||'未填记录人')} · ${esc(o.stage==='d1'?'首次观察':'第 '+o.stage.slice(1)+' 天')}</small></div><time>${esc(o.actual_date)}</time></a>`:'';}).join(''):'<div class="empty">学员提交观察后，这里会显示最新动态。</div>'}</section>
    <section class="panel management-panel"><div class="section-head"><div><span class="eyebrow">21-DAY JOURNEY</span><h2>观察阶段分布</h2></div><span class="small muted">已提交 / 全部档案</span></div><div class="stage-progress">${s.stages.map(x=>`<div><div><span>第 ${x.day} 天</span><b>${x.count} / ${s.total}</b></div><div class="progress-track"><i style="width:${s.total?Math.min(100,x.count/s.total*100):0}%"></i></div></div>`).join('')}</div></section></div>
    <p class="management-foot">档案与照片按账号权限保存 · 教学案例使用需单独授权 · <a href="#/account">我的账号 ↗</a></p>`;
}
