export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function canonicalPath(path,base='/hehuaqing-site/') {
  if(!path.startsWith(base))return null;
  let relative='/'+path.slice(base.length);
  if(relative.endsWith('/'))relative+='index.html';
  if(relative.includes('?')||relative.includes('#')||relative.includes('..')||relative.startsWith('/analytics/'))return null;
  return relative;
}
export function sourceCategory(referrer,agent,origin) {
  if(/MicroMessenger/i.test(agent))return 'wechat';
  if(!referrer)return 'direct';
  try{
    const url=new URL(referrer);
    if(url.origin===origin)return 'internal';
    if(/(^|\.)(baidu|bing|google|sogou|so|yahoo)\./i.test(url.hostname))return 'search';
    if(/(^|\.)(weibo|xiaohongshu|douyin|tiktok|facebook|instagram|x|twitter)\./i.test(url.hostname))return 'social';
    return 'referral';
  }catch{return 'direct';}
}
export function deviceCategory(agent,width) {
  if(/iPad|Tablet/i.test(agent)||(/Macintosh/i.test(agent)&&width<1100))return 'tablet';
  if(/Mobi|Android|iPhone/i.test(agent)||width<600)return 'mobile';
  return 'desktop';
}
export function duration(value) {const n=Math.max(0,Math.round(Number(value)||0));return n<60?n+'秒':Math.floor(n/60)+'分'+(n%60?n%60+'秒':'');}
export const sourceNames={wechat:'微信内打开',search:'搜索引擎',social:'社交网站',internal:'站内跳转',referral:'其他网站',direct:'直接 / 来源未知'};
export const deviceNames={mobile:'手机',tablet:'平板',desktop:'电脑'};
export const categoryNames={home:'首页',article:'文章',poetry:'诗集',book:'电子书',music:'音乐',tcm:'古中医',aform:'上医健康服务档案入口',section:'栏目'};
export function csvCell(value){let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}

