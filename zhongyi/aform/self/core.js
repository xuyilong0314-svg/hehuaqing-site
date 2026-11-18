import {validStage} from '../core.js?v=20261118-progress-2';
export const STAGES=['d1','d3','d7','d14','d21'];
export const ITEMS=[['spirit','精神'],['sleep','睡眠'],['appetite','食欲'],['bowel','排便'],['mood','情绪']];
export const ACTIONS=[['diet','饮食有节'],['movement','运动有度'],['emotion','情志有恒'],['rest','起居有常']];
export const ACTION_VALUES=['已落实','部分落实','未落实','尚未约定'];
export const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
export const stageLabel=s=>s==='d1'?'第 1 天 · 首次自评':validStage(s)?'第 '+s.slice(1)+' 天 · 回访自评':'客户自评';
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const validToken=t=>/^[a-f0-9]{64}$/.test(t||'');
export function readPayload(form,stage){
 const f=new FormData(form),ratings={},actions={};
 for(const [k,label] of ITEMS){const v=f.get(k);if(v===null)throw Error('请为“'+label+'”选择分数，或选择暂不评价。');if(v!=='none'&&!/^[1-5]$/.test(v))throw Error('请重新选择评分。');ratings[k]=v==='none'?null:Number(v);}
 if(stage!=='d1')for(const [k] of ACTIONS){const v=f.get('action_'+k);if(v!==null){if(!ACTION_VALUES.includes(v))throw Error('请重新选择行动情况。');actions[k]=v;}}
 if(!f.has('consent'))throw Error('请确认这是您本人的反馈，并同意用于本次服务记录。');
 const quote=String(f.get('quote')||'').trim();if(quote.length>2000)throw Error('补充感受请控制在 2000 字以内。');
 const actual_date=String(f.get('actual_date')||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(actual_date)||actual_date>today())throw Error('请选择今天或之前的实际记录日期。');
 return {ratings,actions,quote,actual_date,consent:true};
}
export function userError(error){
 const message=String(error?.message||'');
 if(/self_link_(unavailable|not_allowed)/.test(message))return '这条自评链接已失效，请联系上医重新发送。';
 if(/self_invalid/.test(message))return '有内容尚未填完整或日期不正确，请检查后重新提交。';
 if(/timeout|network|fetch|load failed|连接|超时/i.test(message)||error?.name==='TimeoutError')return '网络暂未确认提交结果，已填写内容仍在。请点“重试提交”，不会重复保存。';
 return '暂未确认提交结果，已填写内容仍在。请重试或联系上医。';
}

export function requestUUID(cryptoObject=crypto){
 if(cryptoObject.randomUUID)return cryptoObject.randomUUID();
 const bytes=cryptoObject.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
