import {esc,stageName,stageRecord,stageDays} from './core.js?v=20261126-paper-entry-1';

export function cleanupControls(c,observations,stage,enabled){
 if(!enabled)return '';
 const day=Number(stage.slice(1));
 const canClean=stageRecord(c,observations,day)&&stageDays(c,observations).some(n=>n>day);
 const last=c.progress?.history?.at(-1);
 const canRestore=last?.action==='rollback'&&last.archive_id;
 if(!canClean&&!canRestore)return '';
 return '<div class="followup-cleanup-actions">'+
  (canClean?'<button type="button" class="btn secondary tiny" data-followup-cleanup="preview">清理'+esc(stageName(stage))+'之后的节点</button>':'')+
  (canRestore?'<button type="button" class="text-btn" data-followup-cleanup="restore">恢复上次撤回</button>':'')+'</div>';
}

const label=stage=>esc(stageName(stage));
const contents=s=>[
 s.observations?s.observations+' 条观察记录':'',
 s.photos?s.photos+' 张照片':'',
 s.responses?s.responses+' 份客户自评':'',
 s.links?s.links+' 个自评链接':''
].filter(Boolean);

export function cleanupPrompt(preview){
 const keep=label(preview.keeping);
 const stages=preview.stages||[];
 const actionable=stages.some(s=>contents(s).length||Number(s.stage.slice(1))>Math.max(21,Number(preview.keeping.slice(1))));
 return '<h2>清理'+keep+'之后的节点</h2>'+
  '<p>以'+keep+(preview.actual_date?' · '+esc(preview.actual_date):'')+'为最后一条有效记录。</p><ul class="followup-cleanup-list">'+
  stages.map(s=>'<li><strong>'+label(s.stage)+'</strong><span>'+
   (contents(s).join(' · ')||(Number(s.stage.slice(1))>21?'空白预排节点，将取消':'空白待填节点'))+'</span></li>').join('')+'</ul>'+
  (actionable?'<p class="small muted">已填写内容和自评会移到可恢复记录。对应自评链接暂停，新回访可另建。</p>':
   '<p class="small muted">后续只有待填写的常规节点，可用「收起未填节点」。</p>')+
  (preview.existing_share_links?'<p class="small muted">已有客户分享页使用发布时的快照，清理后可按需要重新发布。</p>':'')+
  '<form id="followup-cleanup-form">'+(actionable&&preview.next_stage?
   '<label class="field" for="followup-cleanup-date">'+label(preview.next_stage)+'下次回访日期<input class="input" id="followup-cleanup-date" type="date" name="date" required value="'+esc(preview.suggested_date)+'"></label>':'')+
  '<p role="alert"></p><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-dialog">返回</button>'+
  (actionable?'<button class="btn" type="submit">撤回并清理</button>':'')+'</div></form>';
}

export function restoreCleanupPrompt(){
 return '<h2>恢复上次撤回</h2><p>将恢复原来的观察、照片、自评及回访安排。</p><form id="followup-cleanup-form">'+
  '<p role="alert"></p><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-dialog">返回</button>'+
  '<button class="btn" type="submit">恢复记录</button></div></form>';
}

export function cleanupError(error){
 const reason=String(error?.message||'');
 if(reason.includes('cleanup_changed'))return '这份档案刚有更新。请重新打开清理窗口核对。';
 if(reason.includes('cleanup_restore_conflict'))return '撤回后已有新记录或排期变动。原内容仍存于撤回记录。';
 if(reason.includes('cleanup_invalid_next_date'))return '下次回访日期要晚于最后一次实际回访。';
 if(reason.includes('cleanup_not_allowed'))return '仅建档人或管理员可以清理或恢复。';
 return '操作结果暂未确认。请刷新档案后核对。';
}
