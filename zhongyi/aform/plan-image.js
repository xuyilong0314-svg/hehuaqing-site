import {productElementLabel,STAGE_FLOW} from './workflow.js?v=20261109-client-plans-1';
import {planRevision} from './case-workspace.js?v=20261109-client-plans-1';

const INK='#203e34',MUTED='#728071',GOLD='#a48c57',LINE='#dce1d5',PAPER='#fffef8';
const SERIF='"Songti SC","STSong","SimSun",serif';
const SANS='"PingFang SC","Microsoft YaHei",sans-serif';
const date=value=>value?String(value).slice(0,10).replaceAll('-','.'):'未填写';
export function imageProduct(product){
  const unused=product.unused||['不安排','未使用'].includes(product.useStatus);
  const pending=!unused&&(!product.useStatus||['待填写','待核对'].includes(product.useStatus))&&!product.amount&&!product.perDay;
  return {name:product.name||'未命名产品',element:productElementLabel(product),time:product.time||'未填写',note:product.note||'',inactive:unused||pending,
    amount:unused?'未用':pending?'待填写':product.amount?product.amount+(product.unit?' '+product.unit:''):'未填写',
    frequency:unused||pending?'—':product.perDay?product.perDay+' 次':'未填写'};
}
export const imageFilename=(c,entry)=>[c.name,STAGE_FLOW[entry.stage]?.plan||'产品方案',entry.plan?.startDate||'日期未填',planRevision(entry)].join('_').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-')+'.png';

export async function renderPlanImage(c,entry,{demo=false}={}){
  if(!entry?.plan)throw Error('请先保存产品方案，再生成图片。');
  if(document.fonts?.ready)await document.fonts.ready;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)throw Error('当前浏览器暂不能生成图片，请使用截图模式。');
  const width=540,left=36,right=504,inner=right-left,p=entry.plan,ops=[];
  const font=(size,weight=400,serif=false)=>`${weight} ${size}px ${serif?SERIF:SANS}`;
  function wrap(value,maxWidth,size,weight=400,serif=false){
    ctx.font=font(size,weight,serif);const lines=[];
    for(const paragraph of String(value??'').split('\n')){
      let line='';for(const character of paragraph){if(line&&ctx.measureText(line+character).width>maxWidth){lines.push(line);line=character;}else line+=character;}lines.push(line);
    }
    return lines;
  }
  function text(value,x,y,maxWidth,size=14,color=INK,weight=400,serif=false,lineHeight=size*1.6){
    const lines=wrap(value,maxWidth,size,weight,serif);
    lines.forEach((line,index)=>ops.push(g=>{g.fillStyle=color;g.font=font(size,weight,serif);g.fillText(line,x,y+index*lineHeight);}));
    return lines.length*lineHeight;
  }
  function rule(y,color=LINE){ops.push(g=>{g.strokeStyle=color;g.lineWidth=.75;g.beginPath();g.moveTo(left,y);g.lineTo(right,y);g.stroke();});}
  function rect(x,y,w,h,color){ops.push(g=>{g.fillStyle=color;g.fillRect(x,y,w,h);});}
  text('上医',left,43,150,36,INK,600,true,46);
  text('健康服务档案',right-105,46,110,13,GOLD,500);
  text('产品使用安排',right-105,68,110,11,MUTED);
  rule(106,GOLD);
  let y=132;
  y+=text(c.name||'客户',left,y,inner,31,INK,600,true,43)+12;
  y+=text(STAGE_FLOW[entry.stage]?.plan||p.title||'产品方案',left,y,inner,18,INK,600,false,28)+8;
  y+=text(date(p.startDate)+' — '+date(p.endDate),left,y,inner,15,MUTED,400,false,24)+17;
  const edition=(entry.status==='draft'?'草稿 · ':'')+planRevision(entry)+(demo?' · 虚构示例':'');
  y+=text(edition,left,y,inner,11,GOLD,500,false,18)+19;
  const columns=[left,left+191,left+286,left+370],widths=[180,84,74,62];
  rect(left-8,y-5,inner+16,34,'#f1f2e9');
  ['产品','使用时间','每次用量','每日次数'].forEach((value,i)=>text(value,columns[i],y+3,widths[i],11,MUTED));y+=43;
  for(const item of (p.products||[]).map(imageProduct)){
    const top=y,color=item.inactive?MUTED:INK;
    let productHeight=text(item.name,columns[0],top,widths[0],17,color,600,true,25);
    if(item.element)productHeight+=text(item.element,columns[0],top+productHeight+4,widths[0],10,GOLD,400,false,16)+4;
    if(item.note)productHeight+=text(item.note,columns[0],top+productHeight+5,widths[0],11,MUTED,400,false,18)+5;
    const time=/^\d{2}:\d{2}[-—–]\d{2}:\d{2}$/.test(item.time)?item.time.slice(0,5)+'\n— '+item.time.slice(-5):item.time;
    const timeHeight=text(time,columns[1],top+2,widths[1],13,color,400,false,21);
    const amountHeight=text(item.amount,columns[2],top+2,widths[2],15,color,500,false,23);
    const countHeight=text(item.frequency,columns[3],top+2,widths[3],15,color,500,false,23);
    y+=Math.max(44,productHeight,timeHeight,amountHeight,countHeight)+20;rule(y-9);y+=8;
  }
  if(!p.products?.length)y+=text('本版未安排产品。',left,y,inner,14,MUTED)+20;
  if(p.note){y+=14;y+=text('安排说明',left,y,inner,12,GOLD,500,false,20)+7;y+=text(p.note,left,y,inner,14,INK,400,false,24)+8;}
  y+=22;rule(y);y+=19;
  const footerTop=y;
  const recorder=text('记录人  '+(c.partner_name||'未填写'),left,y,inner*.6,11,MUTED,400,false,18);
  const saved=entry.savedAt?new Date(entry.savedAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).replaceAll('/','.'):'未填写';
  text('保存日期  '+saved,left,y+recorder+3,inner*.6,10,MUTED,400,false,17);
  text(c.code||'',right-135,y,135,10,GOLD,500,false,17);
  text(planRevision(entry),right-135,y+20,135,10,MUTED,400,false,17);
  y=footerTop+Math.max(recorder+24,40)+26;
  y+=text(demo?'虚构示例 · 不作为使用建议':'上医健康服务档案 · 按本次已保存内容整理',left,y,inner,10,MUTED,400,false,16)+32;
  const height=Math.ceil(y),scale=Math.min(2,12000/height);
  canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);ctx.scale(scale,scale);ctx.textBaseline='top';
  ctx.fillStyle=PAPER;ctx.fillRect(0,0,width,height);ctx.fillStyle=INK;ctx.fillRect(0,0,width,5);
  for(const op of ops)op(ctx);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw Error('图片生成未完成，请重试或使用截图模式。');
  return {blob,filename:imageFilename(c,entry),width:canvas.width,height:canvas.height};
}

export async function openPlanImage(c,entry,options={}){
  const result=await renderPlanImage(c,entry,options),url=URL.createObjectURL(result.blob),modal=document.createElement('dialog');
  modal.className='plan-image-dialog';modal.setAttribute('aria-label','方案图片已生成');
  modal.innerHTML='<div class="plan-image-heading"><div><h2>方案图片已生成</h2><p>可保存发送；微信中也可长按下方图片。</p></div><button type="button" class="text-btn" aria-label="关闭方案图片">关闭</button></div><div class="plan-image-scroll"><img alt="客户产品方案图片，包含使用日期、产品、用量和每日次数"></div><div class="plan-image-actions"><button type="button" class="btn" data-save-plan>保存图片</button><button type="button" class="btn secondary" data-share-plan hidden>分享图片</button></div><p class="plan-image-status" role="status">'+result.width+' × '+result.height+' · PNG 高清图片</p>';
  modal.querySelector('img').src=url;
  const status=modal.querySelector('[role=status]'),close=()=>typeof modal.close==='function'?modal.close():modal.remove();
  modal.querySelector('[aria-label="关闭方案图片"]').onclick=close;
  modal.querySelector('[data-save-plan]').onclick=()=>{const a=document.createElement('a');a.href=url;a.download=result.filename;document.body.append(a);a.click();a.remove();status.textContent='已发起保存。如未出现下载提示，可长按图片保存或发送。';};
  const file=new File([result.blob],result.filename,{type:'image/png'});
  if(navigator.canShare?.({files:[file]})){
    const share=modal.querySelector('[data-share-plan]');share.hidden=false;share.onclick=async()=>{try{await navigator.share({files:[file],title:'产品使用安排'});}catch(error){if(error.name!=='AbortError')status.textContent='暂时无法直接分享，请保存图片后发送。';}};
  }
  modal.addEventListener('close',()=>{URL.revokeObjectURL(url);modal.remove();},{once:true});
  document.body.append(modal);if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
  return result;
}
