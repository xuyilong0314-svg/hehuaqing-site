export const STAGES = [1,3,7,14,21];
export const ITEMS = [['spirit','精神'],['sleep','睡眠'],['appetite','食欲'],['bowel','排便'],['mood','情绪']];
export const PRODUCTS=['人参双茅饮','人参葛根饮','黄精枸杞饮','陈皮四季饮','康美铁玛','灵芝孢子油','睡眠兽'];
export const NEEDS=['日常养护，保持状态','近期劳累，希望恢复','有具体困扰，希望改善'];
export const FEELINGS=['精神不足','睡眠不稳','食欲变化','排便不畅','情绪波动','体力下降'];
export const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
export const today=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const addDays=(date,n)=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10);};
export const dayNumber=(date,now=today())=>Math.round((Date.parse(now+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000)+1;
export const stageName=s=>s==='extra'?'补充记录':s==='d1'?'首次观察':`第 ${s.slice(1)} 天`;
export function nextFollow(c,observations=[]){const pending=STAGES.find(n=>!observations.some(o=>o.case_id===c.id&&o.stage==='d'+n&&o.status==='submitted'));if(!pending)return null;const latest=observations.filter(o=>o.case_id===c.id&&o.status==='submitted').sort((a,b)=>String(b.actual_date).localeCompare(String(a.actual_date)))[0];const scheduled=latest?.data?.nextDate;return {day:pending,date:scheduled||addDays(c.created_on,pending-1)};}
export function csv(rows){return '\ufeff'+rows.map(r=>r.map(v=>{let s=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');}
export const canTeach=c=>c.consent_teaching===true;
export function cleanImageType(file){if(/\.hei[cf]$/i.test(file.name)||/hei[cf]/i.test(file.type))throw Error('请先将 HEIC 照片转换为 JPG，再上传。');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('支持 JPG、PNG、WebP 图片。');if(file.size>10*1024*1024)throw Error('单张照片请小于 10MB。');return true;}
