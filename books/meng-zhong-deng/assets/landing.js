(()=>{
  try{
    const prefs=JSON.parse(localStorage.getItem('mengzhongdeng-preferences-v1')||'null');
    if(prefs&&['light','dark'].includes(prefs.theme))document.documentElement.dataset.theme=prefs.theme;
  }catch{}
  try{
    const value=JSON.parse(localStorage.getItem('mengzhongdeng-reading-v1')||'null');
    if(!value||!/^chapter-\d{2}$/.test(value.chapter))return;
    const link=document.querySelector('.book-contents a[href="read.html#'+value.chapter+'"]');
    if(!link)return;
    const title=link.children[1].textContent;
    const resume=document.getElementById('resume-link');
    resume.textContent='继续阅读 · '+title;
    resume.hidden=false;
  }catch{}
})();
