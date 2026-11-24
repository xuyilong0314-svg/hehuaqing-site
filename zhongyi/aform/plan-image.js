import {openImageSave} from '../../share/image-save.js?v=20261121-plan-sharing-1';
import {productElementLabel} from './workflow.js?v=20261124-fire-label-1';
import {planEdition,planSetLabel,planTitle} from './case-workspace.js?v=20261124-fire-label-1';

const INK='#203e34',MUTED='#728071',GOLD='#a48c57',LINE='#dce1d5',PAPER='#fffef8';
const SERIF='"Songti SC","STSong","SimSun",serif';
const SANS='"PingFang SC","Microsoft YaHei",sans-serif';
const date=value=>value?String(value).slice(0,10).replaceAll('-','.'):'未填写';
const COMPOUND_SURNAMES=['欧阳','司马','上官','诸葛','夏侯','东方','皇甫','尉迟','公孙','慕容','宇文','司徒','司空','南宫','令狐','长孙','独孤','轩辕','澹台','申屠','太史','端木','百里','呼延','东郭','西门','拓跋','公羊','公冶','宗政','濮阳','淳于','单于','太叔','仲孙','钟离','鲜于','公良','段干','巫马','公西','颛孙','子车','梁丘','左丘','东门','羊舌','微生','闾丘','谷梁'];
export function practitionerTitle(registeredName){
  const name=String(registeredName??'').trim().replace(/\s+/g,'');
  if(!/^[\p{Script=Han}]{1,6}$/u.test(name)||/^(演示|测试|未填)/.test(name))return '上医';
  return (COMPOUND_SURNAMES.find(surname=>name.startsWith(surname))||Array.from(name)[0])+'上医';
}
export function imageProduct(product){
  const unused=product.unused||['不安排','未使用'].includes(product.useStatus);
  const pending=!unused&&(!product.useStatus||['待填写','待核对'].includes(product.useStatus))&&!product.amount&&!product.perDay;
  return {name:product.name||'未命名产品',element:productElementLabel(product),time:product.time||'未填写',note:product.note||'',inactive:unused||pending,
    amount:unused?'未用':pending?'待填写':product.amount?product.amount+(product.unit?' '+product.unit:''):'未填写',
    frequency:unused||pending?'—':product.perDay?product.perDay+' 次':'未填写'};
}
const fileName=parts=>parts.join('_').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-')+'.png';
export const imageFilename=(c,entry)=>fileName([c.name,planTitle(entry),entry.plan?.startDate||'日期未填',planEdition(entry)]);
const planRange=entry=>date(entry.plan.startDate)+' — '+date(entry.plan.endDate);
const savedDate=entry=>entry.savedAt?new Date(entry.savedAt).toLocaleDateString('zh-CN',{
  timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'
}).replaceAll('/','.'):'未填写';

function imagePages(breaks,maxHeight){
  const pages=[];
  let start=breaks[0],end=start;
  for(const next of breaks.slice(1)){
    if(next.y-start.y>maxHeight&&end!==start){
      pages.push({start,end});
      start=end;
    }
    end=next;
  }
  pages.push({start,end});
  return pages;
}

export async function renderPlanImage(c,selection,{demo=false,practitionerName='',compare=false}={}){
  const entries=Array.isArray(selection)?selection:[selection];
  if(!entries.length||entries.some(entry=>!entry?.plan))throw Error('请先保存产品方案，再生成图片。');
  if(document.fonts?.ready)await document.fonts.ready;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)throw Error('当前浏览器暂不能生成图片，请使用截图模式。');
  const width=540,left=36,right=504,inner=right-left,ops=[],breaks=[{y:0,index:0,context:''}];
  const multi=entries.length>1,comparison=multi&&compare;
  const title=comparison?'产品方案对比':multi?'全部产品方案':planTitle(entries[0]);
  const practitioner=practitionerTitle(practitionerName);
  const client=c.name||'客户';
  const columns=comparison?[left,left+146,left+270,left+375]:[left,left+191,left+286,left+370];
  const widths=comparison?[135,113,94,70]:[180,84,74,70];
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
  function pageBreak(y,context=''){
    if(y>breaks.at(-1).y)breaks.push({y,index:ops.length,context});
  }
  function tableHead(y,firstColumn){
    rect(left-8,y-5,inner+16,34,'#f1f2e9');
    [firstColumn,'使用时间','每次用量','每日次数'].forEach((value,i)=>text(value,columns[i],y+3,widths[i],12,MUTED));
    return y+41;
  }
  function productRow(top,item,label,subtitle='',context=''){
    const color=item.inactive?MUTED:INK;
    let labelHeight=text(label,columns[0],top,widths[0],comparison?15:17,color,600,!comparison,25);
    if(subtitle)labelHeight+=text(subtitle,columns[0],top+labelHeight+3,widths[0],11,GOLD,400,false,16)+3;
    if(item.note)labelHeight+=text(item.note,columns[0],top+labelHeight+4,widths[0],12,MUTED,400,false,19)+4;
    const time=/^\d{2}:\d{2}[-—–]\d{2}:\d{2}$/.test(item.time)?item.time.slice(0,5)+'\n— '+item.time.slice(-5):item.time;
    const timeHeight=text(time,columns[1],top+2,widths[1],13,color,400,false,21);
    const amountHeight=text(item.amount,columns[2],top+2,widths[2],15,color,500,false,23);
    const countHeight=text(item.frequency,columns[3],top+2,widths[3],15,color,500,false,23);
    const bottom=top+Math.max(34,labelHeight,timeHeight,amountHeight,countHeight)+18;
    rule(bottom-9);
    pageBreak(bottom,context);
    return bottom;
  }
  function editionHeader(y,entry,{compact=false}={}){
    y+=text(planTitle(entry),left,y,inner,compact?16:19,INK,600,false,27)+4;
    y+=text(planEdition(entry)+' · '+planRange(entry),left,y,inner,14,MUTED,500,false,22);
    if(!compact)y+=text('保存日期 '+savedDate(entry),left,y,inner,12,GOLD,500,false,19);
    return y;
  }
  function planNote(y,note,context){
    if(!note)return y;
    y+=text('安排说明',left,y,inner,13,GOLD,600,false,22)+3;
    // Long free-text notes can continue on another page without shrinking the table.
    for(const line of wrap(note,inner,14)){
      y+=text(line,left,y,inner,14,INK,400,false,24);
      pageBreak(y,context+' · 安排说明');
    }
    return y;
  }
  function planSection(y,entry){
    const context=planTitle(entry);
    y=editionHeader(y,entry)+14;
    const products=(entry.plan.products||[]).map(imageProduct);
    if(products.length){
      y=tableHead(y,'产品');
      for(const item of products)y=productRow(y,item,item.name,item.element,context);
    }else y+=text('本版未安排产品。',left,y,inner,14,MUTED)+14;
    y+=12;
    const {decision,note}=entry.plan;
    if(decision&&decision!=='待填写')y+=text('本次安排 · '+decision,left,y,inner,13,MUTED,400,false,21)+5;
    return planNote(y,note,context)+18;
  }
  function comparisonSection(y){
    for(const entry of entries){
      y=editionHeader(y,entry,{compact:true});
      if(entry.plan.note)y=planNote(y+4,entry.plan.note,planSetLabel(entry.stage));
      y+=14;
      pageBreak(y);
    }
    const products=new Map();
    for(const entry of entries){
      for(const product of entry.plan.products||[]){
        const item=imageProduct(product),key=item.name.trim()||item.name;
        if(!products.has(key))products.set(key,new Map());
        const byStage=products.get(key);
        if(!byStage.has(entry.stage))byStage.set(entry.stage,[]);
        byStage.get(entry.stage).push(item);
      }
    }
    if(!products.size)y+=text('所选版本未安排产品。',left,y,inner,14,MUTED)+17;
    for(const [name,byStage] of products){
      pageBreak(y);
      y+=text(name,left,y,inner,18,INK,600,true,26)+9;
      const element=[...byStage.values()][0][0].element;
      if(element)y+=text(element,left,y,inner,11,GOLD,400,false,17)+7;
      y=tableHead(y,'方案套次');
      for(const entry of entries){
        const rows=byStage.get(entry.stage)||[{time:'—',amount:'未列入',frequency:'—',inactive:true}];
        for(const item of rows)y=productRow(y,item,planSetLabel(entry.stage),'',name);
      }
      y+=20;
    }
    return y;
  }

  text(practitioner,left,43,190,36,INK,600,true,46);
  text('健康服务档案',right-148,44,148,18,GOLD,600);
  text('产品使用安排',right-148,74,148,14,MUTED,500);
  rule(106,GOLD);
  let y=132;
  y+=text(client,left,y,inner,31,INK,600,true,43)+12;
  if(multi)y+=text(title+' · '+entries.length+' 套',left,y,inner,22,INK,600,false,32)+12;
  if(demo)y+=text('虚构示例',left,y,inner,13,GOLD,600,false,20)+8;
  if(comparison)y=comparisonSection(y);
  else for(const entry of entries){
    pageBreak(y);
    y=planSection(y,entry);
    if(entry!==entries.at(-1)){
      rule(y,GOLD);
      y+=20;
    }
  }
  y+=12;rule(y);y+=16;
  const recorder=text('记录人  '+(c.partner_name||'未填写'),left,y,inner*.68,12,MUTED,400,false,19);
  text(c.code||'',right-125,y,125,11,GOLD,500,false,17);
  y+=Math.max(recorder,19)+15;
  y+=text(demo?'虚构示例 · 不作为使用建议':'上医健康管理服务表 · 按本次已保存内容整理',left,y,inner,11,MUTED,400,false,18)+24;
  pageBreak(Math.ceil(y));

  const pages=imagePages(breaks,3400),images=[];
  const filename=multi?fileName([c.name,title]):imageFilename(c,entries[0]);
  for(const [index,{start,end}] of pages.entries()){
    const continuation=index>0?112:0;
    const height=end.y-start.y+continuation+(pages.length>1?36:0);
    const scale=Math.min(2,7500/height);
    canvas.width=Math.ceil(width*scale);
    canvas.height=Math.ceil(height*scale);
    ctx.scale(scale,scale);
    ctx.textBaseline='top';
    ctx.fillStyle=PAPER;
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle=INK;
    ctx.fillRect(0,0,width,5);
    if(continuation){
      ctx.font=font(18,600);
      ctx.fillText(practitioner+' · '+client,left,24,inner);
      ctx.font=font(15,500);
      ctx.fillText(title+(demo?' · 虚构示例':''),left,52,inner);
      ctx.fillStyle=MUTED;
      ctx.font=font(13);
      ctx.fillText(start.context,left,77,inner);
    }
    ctx.save();
    ctx.translate(0,continuation-start.y);
    for(let i=start.index;i<end.index;i++)ops[i](ctx);
    ctx.restore();
    if(pages.length>1){
      ctx.fillStyle=MUTED;
      ctx.font=font(12);
      ctx.fillText('第 '+(index+1)+' / '+pages.length+' 张',left,height-24,inner);
    }
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw Error('图片生成未完成，请重试或使用截图模式。');
    const pageName=pages.length>1?filename.slice(0,-4)+'_'+(index+1)+'.png':filename;
    images.push({blob,filename:pageName,width:canvas.width,height:canvas.height});
  }
  return images.length>1?{...images[0],pages:images}:images[0];
}

export async function openPlanImage(c,selection,options={}){
  const result=await renderPlanImage(c,selection,options);
  const title=options.compare?'保存方案对比图':'保存方案图片';
  openImageSave({...result,title,alt:'客户产品方案图片，包含使用日期、产品、用量和每日次数'});
  return result;
}
