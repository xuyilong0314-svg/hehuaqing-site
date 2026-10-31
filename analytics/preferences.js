import {PREFERENCE_KEY,OWNER_DEVICE_KEY} from './config.js?v=20261031-20';
const output=document.querySelector('#preference-state');
function state(){try{output.textContent=navigator.doNotTrack==='1'||navigator.globalPrivacyControl?'当前：已按浏览器隐私设置停止统计。':localStorage.getItem(OWNER_DEVICE_KEY)==='yes'?'当前：这是管理员已排除的设备，不计入访问统计。':localStorage.getItem(PREFERENCE_KEY)==='off'?'当前：已关闭本浏览器的访问统计。':'当前：允许匿名访问统计。';}catch{output.textContent='当前浏览器无法保存偏好，请使用浏览器的“不跟踪”设置。';}}
document.querySelector('#stats-off').onclick=()=>{try{localStorage.setItem(PREFERENCE_KEY,'off');localStorage.removeItem('hhq-analytics-day');state();}catch{state();}};
document.querySelector('#stats-on').onclick=()=>{try{localStorage.setItem(PREFERENCE_KEY,'on');state();}catch{state();}};state();
