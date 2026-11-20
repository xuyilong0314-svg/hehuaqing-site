// Images stay in this browser, including private health plans. No upload is needed.
export function blobToImageURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('图片读取失败，请关闭后重新生成。'));
    reader.readAsDataURL(blob);
  });
}
export function imageFile(blob, filename) {
  try { return new File([blob], filename, {type:blob.type || 'image/png'}); } catch { return null; }
}
export function canShareImage(file, nav = navigator) {
  try { return Boolean(file && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({files:[file]})); } catch { return false; }
}
function element(tag, text, cls) {
  const node = document.createElement(tag); if (text) node.textContent = text; if (cls) node.className = cls; return node;
}
function styles() {
  if (document.getElementById('hhq-image-save-style')) return;
  const style = element('style'); style.id = 'hhq-image-save-style';
  style.textContent = `.hhq-image-save{box-sizing:border-box;width:min(620px,calc(100% - 24px));max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);margin:auto;padding:0;border:1px solid #d9dfd6;border-radius:16px;background:#faf9f4;color:#214638;box-shadow:0 24px 100px #0005;overflow:auto;font:16px/1.6 system-ui,sans-serif;text-align:left}.hhq-image-save::backdrop{background:#10251ed1}.hhq-image-save.hhq-image-save-fallback{position:fixed;inset:12px;z-index:2147483647;box-shadow:0 0 0 100vmax #10251ed1}.hhq-image-save *{box-sizing:border-box}.hhq-image-save [hidden]{display:none!important}.hhq-image-save header{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:#faf9f4;border-bottom:1px solid #d9dfd6}.hhq-image-save h2{margin:0;font:600 21px/1.5 Georgia,"Songti SC",serif}.hhq-image-save button,.hhq-image-save a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 14px;border:1px solid #becbc2;border-radius:7px;background:transparent;color:#214638;font:500 15px/1.5 system-ui,sans-serif;text-decoration:none;cursor:pointer}.hhq-image-save button:focus-visible,.hhq-image-save a:focus-visible{outline:3px solid #a6874b;outline-offset:2px}.hhq-image-save p{margin:14px 18px;font:inherit}.hhq-image-save .hhq-image-save-guide{font-weight:600}.hhq-image-save img{display:block;width:calc(100% - 36px);height:auto;max-width:none;margin:16px 18px;border-radius:2px;-webkit-touch-callout:default!important;-webkit-user-select:auto!important;user-select:auto!important;touch-action:auto;pointer-events:auto!important}.hhq-image-save-actions{display:flex;gap:10px;flex-wrap:wrap;margin:16px 18px}.hhq-image-save-actions>*{flex:1 1 160px}.hhq-image-save-actions button{background:#214638;color:#fff;border-color:#214638}.hhq-image-save .hhq-image-save-status{font-size:13px;color:#596a60;padding-bottom:max(6px,env(safe-area-inset-bottom))}.hhq-image-save button:disabled{opacity:.6;cursor:wait}`;
  document.head.append(style);
}
export function openImageSave({blob, filename = '分享图片.png', title = '保存图片', alt = '长按这张图片保存', width, height}) {
  styles();
  const opener = document.activeElement, modal = element('dialog', '', 'hhq-image-save');
  modal.setAttribute('aria-label',title); modal.setAttribute('aria-modal','true');
  const head = element('header'), heading = element('h2',title), closeButton = element('button','关闭'); closeButton.type = 'button';
  head.append(heading,closeButton);
  const guide = element('p','长按下方图片，选择“保存图片”或“存储图像”。','hhq-image-save-guide');
  const img = element('img'); img.alt = alt; img.hidden = true;
  const actions = element('div','','hhq-image-save-actions');
  const native = element('button','系统保存 / 分享'); native.type = 'button'; native.hidden = true;
  const download = element('a','下载图片文件'); download.hidden = true; download.download = filename;
  const status = element('p','正在准备图片…','hhq-image-save-status'); status.setAttribute('role','status');
  actions.append(native,download); modal.append(head,guide,actions,img,status); document.body.append(modal);
  let disposed = false;
  const cleanup = () => { if (disposed) return; disposed = true; modal.remove(); if (opener?.isConnected) opener.focus({preventScroll:true}); };
  const close = () => { if (typeof modal.close === 'function' && modal.open) modal.close(); cleanup(); };
  closeButton.onclick = close; modal.addEventListener('close',cleanup,{once:true});
  modal.addEventListener('keydown',e => {if (e.key === 'Escape') {e.preventDefault();close();}});
  modal.addEventListener('click',e => {if(e.target === modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  if (typeof modal.showModal === 'function') modal.showModal();
  else {modal.setAttribute('open','');modal.setAttribute('role','dialog');modal.classList.add('hhq-image-save-fallback');}
  closeButton.focus({preventScroll:true});
  const file = imageFile(blob,filename);
  blobToImageURL(blob).then(url => {
    if (disposed) return;
    img.src = url; img.hidden = false; download.href = url; download.hidden = false;
    const mobile = /Android|iPhone|iPad|iPod|MicroMessenger/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
    guide.textContent = mobile ? '长按下方图片，选择“保存图片”或“存储图像”。' : '点击“下载图片文件”保存；手机上可长按图片保存。';
    native.hidden = !canShareImage(file);
    status.textContent = (width && height ? `${width} × ${height} · PNG 图片。` : '') + (native.hidden ? '如未出现保存选项，可下载图片文件，在浏览器下载记录中查看。' : '也可点“系统保存 / 分享”，在系统面板中选择保存图像；未提供保存选项时，可长按图片或下载文件。');
  }).catch(error => {if (!disposed) status.textContent = error.message;});
  download.onclick = () => {status.textContent = '已发起文件下载，请在浏览器下载记录中查看。需要存入相册时，可长按上方图片选择保存。';};
  native.onclick = async () => {
    native.disabled = true;
    try {
      // Call within the click: preparing images here would lose user activation on mobile.
      await navigator.share({files:[file],title});
      if (!disposed) status.textContent = '系统面板已关闭，请到相册或所选应用中查看。';
    } catch (error) {
      if (!disposed) status.textContent = error.name === 'AbortError' ? '已返回图片。可继续长按保存，或重新打开系统面板。' : '当前浏览器无法打开系统面板。请长按图片保存，或下载图片文件。';
    } finally {native.disabled = false;}
  };
  return modal;
}
