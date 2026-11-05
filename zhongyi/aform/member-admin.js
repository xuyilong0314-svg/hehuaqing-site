import {esc} from './core.js';

export function duplicateNames(members=[]) {
  const counts=new Map();
  for(const member of members){const name=(member.display_name||'').trim();if(name)counts.set(name,(counts.get(name)||0)+1);}
  return new Set([...counts].filter(([,count])=>count>1).map(([name])=>name));
}
export function memberStatus(member) {
  if(member.protected_role)return '管理账号';
  if(member.email_confirmed===false&&!member.last_sign_in_at)return '尚未登录';
  return member.email_confirmed===true?'可登录':'已注册';
}
export function memberCard(member,{admin=false,duplicate=false}={}) {
  return `<article class="panel member-card"><div class="row"><div class="record-avatar">${esc((member.display_name||'学员').slice(0,1))}</div><div class="grow"><h3>${esc(member.display_name||'未填写姓名')}</h3><span class="small muted">${esc(member.class_name||'尚未填写班级')}</span></div><span class="badge ${member.recordCount?'':'outline'}">${member.recordCount?'已建档':'待建档'}</span></div><p class="member-email">${esc(member.email||'未填写邮箱')}</p><div class="member-status-row"><span class="badge outline">${memberStatus(member)}</span>${duplicate?'<span class="member-duplicate">有同名账号 · 请核对邮箱</span>':''}</div><div class="member-numbers"><span><b>${Number(member.recordCount)||0}</b>份档案</span><span><b>${Number(member.observationCount)||0}</b>次观察</span><span><b>${Number(member.photoCount)||0}</b>张照片</span></div><div class="member-card-footer"><small class="muted">注册 ${esc((member.created_at||'').slice(0,10))}</small><div class="member-card-actions"><a class="btn tiny secondary" href="#/collect?owner=${encodeURIComponent(member.id)}">查看档案 ↗</a>${admin&&!member.protected_role?`<button class="text-btn member-delete" data-member-delete="${esc(member.id)}">删除多余账号</button>`:''}</div></div></article>`;
}
export function deletionDialog(details) {
  const labels={cases:'份档案（含回收站）',observations:'次观察',photos:'张照片',reading:'条阅读资料',team:'条团队资料',reviews:'条老师整理',storage:'个存储文件'};
  const present=Object.entries(details.usage||{}).filter(([,n])=>Number(n)>0);
  const blocked=details.reason==='self'?'不能删除您当前使用的账号。':details.reason==='staff'?'管理账号受到保护，不能在这里删除。':'这个账号已有资料，请先保留，避免丢失记录。';
  return `<section class="member-delete-dialog"><p class="eyebrow">会员账号</p><h2>${details.deletable?'删除这个空账号？':'这个账号需要保留'}</h2><div class="member-delete-identity"><strong>${esc(details.display_name||'未填写姓名')}</strong><span>${esc(details.email||'未填写邮箱')}</span></div>${details.deletable?`<p>该账号没有健康档案、照片、阅读或团队资料。删除后无法恢复，其他账号不受影响。</p><form id="delete-member-form"><div id="form-error"></div><label class="label" for="member-confirm-email">请重新输入上方邮箱，确认删除对象</label><input class="input" id="member-confirm-email" name="confirm_email" type="email" required autocomplete="off" placeholder="输入要删除的账号邮箱"><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-dialog">保留账号</button><button type="submit" class="btn danger-button" disabled>确认删除空账号</button></div></form>`:`<p>${blocked}</p>${present.length?'<ul class="member-protected-data">'+present.map(([key,n])=>`<li>${Number(n)} ${labels[key]||'条关联资料'}</li>`).join('')+'</ul>':''}<div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-dialog">知道了</button></div>`}</section>`;
}
export function matchingEmail(value,email) {
  return Boolean(email)&&String(value||'').trim().toLowerCase()===String(email).trim().toLowerCase();
}
export function memberError(error) {
  const message=error?.message||'';
  if(message.includes('member_admin_only'))return '仅最高管理员可以清理账号。';
  if(message.includes('member_protected'))return '您的账号与管理账号受到保护，无法删除。';
  if(message.includes('member_has_data')||error?.code==='23503')return '这个账号已有资料，已保留。请刷新后核对。';
  if(message.includes('member_email_mismatch'))return '邮箱与待删除账号不一致，请核对后再输入。';
  if(message.includes('member_changed')||error?.code==='40001')return '账号刚刚发生更新，请关闭窗口，重新核对后再操作。';
  if(message.includes('member_not_found'))return '这个账号已不存在，请刷新列表。';
  return '暂时无法完成，请刷新后重试。';
}
