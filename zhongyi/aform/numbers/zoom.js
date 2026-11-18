// The dialog remains inside its protected result: revocation or replacement removes it too.
export function numberSummary(t){
 const n=k=>Number.isInteger(Number(t[k]))&&Number(t[k])>=1&&Number(t[k])<=9?Number(t[k]):'—';
 const row=(label,keys)=>'<div><dt>'+label+'</dt><dd>'+keys.map(n).join(' · ')+'</dd></div>';
 return '<section class="number-summary" aria-label="数字结果文字版"><h3>数字结果 · 从左到右</h3><dl>'+row('主性格数',['G'])+row('底层四数',['A','B','C','D'])+row('内部左右组',['E','F'])+row('工作、朋友（左侧）',['L3','L1','L2'])+row('下属、儿女（顶数）',['U3'])+row('下属、儿女（下排）',['U1','U2'])+row('晚年、家庭（右侧）',['R1','R2','R3'])+'</dl></section>';
}
export function zoomMarkup(svg){return '<button type="button" class="number-zoom-button" data-number-zoom aria-haspopup="dialog">放大查看三角形 ↗</button><dialog class="number-zoom-dialog" aria-label="放大数字三角形"><header><strong>数字三角形</strong><button type="button" data-number-close aria-label="关闭放大，返回数字结果">关闭 ×</button></header><p>左右滑动查看全图；文字结果在原页面下方。</p><div class="number-zoom-scroll" tabindex="0" aria-label="可左右滚动的三角形">'+svg+'</div></dialog>';}
if(globalThis.document)document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-number-zoom],[data-number-close]');
 if(button){event.preventDefault();event.stopImmediatePropagation();const dialog=button.hasAttribute('data-number-close')?button.closest('dialog'):button.nextElementSibling;if(!dialog)return;if(button.hasAttribute('data-number-close'))dialog.close();else {dialog.showModal();const pane=dialog.querySelector('.number-zoom-scroll');pane.scrollLeft=Math.max(0,(pane.scrollWidth-pane.clientWidth)/2);}return;}
 if(event.target.matches?.('dialog.number-zoom-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}
});
