import {publicApiFetch} from '../zhongyi/aform/auth.js';
export function createSharedClient(config=window.AFORM_CONFIG, factory=window.supabase?.createClient) {
 if(!config?.ready || !factory) throw new Error('account_unavailable');
 // Match the existing A-form client: default Supabase storage key, same project and origin.
 // No secondary user table, password store or alternate session is created.
 return factory(config.url, config.key, {
  global:{fetch:publicApiFetch(config.key)},
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
}
export function accountUrl(location) {
 const local=['127.0.0.1','localhost'].includes(location.hostname);
 return local?'https://www.hehuaqing.com/zhongyi/aform/#/auth':'/zhongyi/aform/#/auth';
}
export function friendly(error) {
 const m=error?.message||String(error);
 const map={
  'Invalid login':'邮箱或密码不正确。','Email not confirmed':'请先在邮箱中完成验证。',
  'login_required':'请先登录全站账号。','member_required':'您的团队权限已改变，请刷新查看。',
  'owner_setup_forbidden':'请由网站管理员首次启用，或等待团队负责人安排。',
  'owner_required':'这一步由团队负责人确认。','owner_transfer_required':'负责人退出前，请先完成负责人交接。',
  'lead_required':'请由项目牵头人或团队负责人安排分工。',
  'decision_authority_required':'请指定项目牵头人或团队负责人确认。','decider_required':'这项决定请由指定的人确认。','receiver_required':'请由接手人检查成果。',
  'task_owner_required':'请由这项工作的承担人操作。','version_conflict':'这条记录已被更新。输入仍保留，请先复制，再关闭并重新打开核对。',
  'record_in_trash':'这条记录已删除，请先到回收站恢复。','project_in_trash':'所在项目已删除，请先恢复项目。','already_in_trash':'这条记录已在回收站中，请刷新查看。','not_in_trash':'这条记录已经恢复，请刷新查看。','trash_kind_required':'目前支持删除项目和具体任务。','unknown_action':'当前服务暂不支持这项操作，请刷新或联系负责人。','invalid_transition':'进度已改变，请刷新后查看。','confirmed_decision_required':'先确认相关决定，再安排执行。',
  'separate_receiver_required':'请为成果选择另一位接手人。','source_mismatch':'讨论与当前项目不一致。',
  'already_joined':'已提交申请或已经加入，请刷新查看。','request_conflict':'这次提交内容已改变，请重新打开表单。',
  'invalid_date':'请填写有效的完成日期。','Failed to fetch':'连接中断，输入仍保留。请检查网络后重试。',
  'fetch failed':'网络连接未成功，请稍后重试。','PGRST202':'团队服务尚未启用，请联系管理员完成接入。',
  'account_unavailable':'全站账号服务未能加载，请刷新重试。'
 };
 for(const [key,value] of Object.entries(map)) if(m.includes(key)||error?.code===key)return value;
 if(m.includes('invalid_field'))return '请完整填写，标题不超过 100 字，正文不超过 2400 字。';
 if(m.includes('permission'))return '当前账号没有这项操作权限。';
 return '暂未完成，请刷新后重试；内容仍保留在表单中。';
}
export class TeamApi {
 constructor(client){this.client=client;}
 async rpc(name,args){const r=await this.client.rpc(name,args);if(r.error)throw r.error;return r.data;}
 context(){return this.rpc('team_context',{p_slug:'quanzhou'});}
 snapshot(id){return this.rpc('team_snapshot',{p_team:id});}
 command(id,action,args,request){return this.rpc('team_command',{p_team:id,p_action:action,p_args:args,p_request:request});}
}
