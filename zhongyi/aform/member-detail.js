import {ageFromBirthDate,genderLabel} from '../../account/identity.js?v=20261121-gender-1';
import {esc} from './core.js';
import {memberStatus} from './member-admin.js?v=20261121-gender-1';
import {resultMarkup} from './numbers/view.js?v=20261119-ux-1';

const shown=value=>esc(value||'尚未填写');
const date=value=>value?esc(new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})):'尚未登录';

export function memberDetailError(error){
 return error?.code==='42501'?'学员账号已不存在，或您当前没有查看权限。':'学员资料暂未读取成功，请检查网络后重试。';
}

export function memberDetailMarkup(member,{cases=[],observations=[],photos=[],recordMarkup=()=>''}={}){
 const owned=cases.filter(c=>c.owner_id===member.id&&!c.deleted_at),ids=new Set(owned.map(c=>c.id));
 const self=owned.filter(c=>c.kind==='self'),clients=owned.filter(c=>c.kind!=='self');
 const observationsCount=observations.filter(o=>ids.has(o.case_id)&&o.status==='submitted').length;
 const photoCount=photos.filter(p=>ids.has(p.case_id)).length;
 const age=ageFromBirthDate(member.birth_date);
 const info=[['邮箱',member.email],['联系电话',member.phone],['公历生日',member.birth_date],['年龄（周岁）',age===null?'':String(age)],['性别',genderLabel(member.gender)],['所在地',member.location],['学习情况',member.has_studied===true?'已参加学习':member.has_studied===false?'尚未参加学习':'尚未填写'],['学习期数',member.class_name|| (member.has_studied===false?'暂无':'尚未填写')]];
 const number=member.number_allowed&&member.number_result?resultMarkup(member.number_result,{print:false}):'<div class="empty">您的账号尚未开通数字性格。</div>';
 return `<div class="member-detail" data-member-id="${esc(member.id)}">
 <a class="back" href="#/students">← 返回学员列表</a>
 <header class="page-heading member-detail-heading"><div><p class="eyebrow">学员后台</p><h1>${esc(member.display_name||'未填写姓名')}</h1><div class="member-detail-tags"><span class="badge outline">${memberStatus(member)}</span>${member.zodiac?`<span class="badge">${esc(member.zodiac)}</span>`:''}<span class="small muted">${owned.length?'已建立档案':'尚未建立服务档案'}</span></div></div><button class="btn secondary tiny" data-action="refresh-workspace">刷新资料</button></header>
 <nav class="member-section-nav" aria-label="学员资料分区"><button type="button" data-member-section="member-profile">基本资料</button><button type="button" data-member-section="member-numbers">数字性格</button><button type="button" data-member-section="member-records">服务档案 · ${owned.length}</button></nav>
 <section class="panel" id="member-profile"><h2>基本资料</h2><dl class="member-profile-grid">${info.map(([label,value])=>`<div><dt>${label}</dt><dd>${shown(value)}</dd></div>`).join('')}</dl><div class="member-profile-dates"><span>注册 ${member.created_at?date(member.created_at):'日期未记录'}</span><span>最近登录 ${date(member.last_sign_in_at)}</span></div></section>
 <section class="panel member-number-detail" id="member-numbers"><div class="member-section-heading"><h2>数字性格</h2><span class="small muted">学员本人</span></div><p class="small muted">根据学员账号中填写的公历生日生成。</p>${number}</section>
 <section id="member-records"><div class="member-section-heading"><h2>服务档案</h2><a class="text-btn" href="#/collect?owner=${encodeURIComponent(member.id)}">查看全部 ↗</a></div><p class="small muted">这位学员账号名下的本人记录与客户档案。</p><div class="member-overview-counts"><span><b>${owned.length}</b> 份档案</span><span><b>${observationsCount}</b> 次已提交观察</span><span><b>${photoCount}</b> 张照片</span></div>${owned.length?`<h3>本人记录 · ${self.length}</h3><div class="record-list">${self.map(recordMarkup).join('')||'<p class="small muted">尚未建立本人记录。</p>'}</div><h3>负责的客户 · ${clients.length}</h3><div class="record-list">${clients.map(recordMarkup).join('')||'<p class="small muted">尚未建立客户档案。</p>'}</div>`:'<div class="empty panel"><h3>尚未建立服务档案</h3><p>可先查看上方已填写的个人资料。学员建档后，记录会显示在这里。</p></div>'}</section></div>`;
}
