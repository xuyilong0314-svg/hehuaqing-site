import {identityToday} from '../../account/identity.js?v=20261118-number-name-1';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
export function daysInBirthMonth(year,month){
  const y=Number(year),m=Number(month);
  if(m===2)return !/^\d{4}$/.test(String(year))||y%4===0&&(y%100!==0||y%400===0)?29:28;
  return [4,6,9,11].includes(m)?30:31;
}
export function birthDateFromParts(year,month,day,today=identityToday()){
  const y=String(year).trim(),m=Number(month),d=Number(day);
  if(!/^\d{4}$/.test(y)||Number(y)<1900||Number(y)>Number(today.slice(0,4)))return {date:'',error:y.length===4?'年份应在1900年至今年之间。':''};
  if(!month||!day)return {date:'',error:''};
  if(!Number.isInteger(m)||m<1||m>12||!Number.isInteger(d)||d<1||d>daysInBirthMonth(y,m))return {date:'',error:'这个月没有所选日期，请重新选择。'};
  const date=`${y}-${pad(m)}-${pad(d)}`;
  return date>today?{date:'',error:'出生日期不能晚于今天。'}:{date,error:''};
}
const options=(count,value,unit)=>'<option value="">'+unit+'</option>'+Array.from({length:count},(_,i)=>`<option value="${i+1}"${Number(value)===i+1?' selected':''}>${i+1}${unit}</option>`).join('');
export function birthDateField(value=''){
  const [year='',month='',day='']=String(value).split('-');
  return `<fieldset class="field birth-date-field" data-birth-date><legend class="label">出生年月日（公历） <span class="gold">必填</span></legend><div class="birth-date-parts"><label for="birth-year"><span>年</span><input class="input" id="birth-year" name="birth_year" data-birth-part="year" type="text" inputmode="numeric" autocomplete="bday-year" pattern="[0-9]{4}" maxlength="4" placeholder="如 1968" value="${esc(year)}" required aria-describedby="birth-date-help"></label><label for="birth-month"><span>月</span><select id="birth-month" name="birth_month" data-birth-part="month" autocomplete="bday-month" required>${options(12,month,'月')}</select></label><label for="birth-day"><span>日</span><select id="birth-day" name="birth_day" data-birth-part="day" autocomplete="bday-day" required>${options(daysInBirthMonth(year,month),day,'日')}</select></label></div><input type="hidden" name="birth_date" value="${esc(value)}"><p class="help" id="birth-date-help" data-birth-help aria-live="polite">直接输入4位年份，再选择月、日。</p></fieldset>`;
}
// The hidden ISO value preserves the existing save contract; no locale date parsing.
export function syncBirthDate(form,{fromValue=false}={}){
  const box=form?.querySelector('[data-birth-date]');if(!box)return;
  const year=form.elements.birth_year,month=form.elements.birth_month,day=form.elements.birth_day,stored=form.elements.birth_date;
  if(fromValue){const p=stored.value.split('-');year.value=p[0]||'';month.value=p[1]?String(Number(p[1])):'';day.innerHTML=options(daysInBirthMonth(year.value,month.value),p[2]||'','日');}
  year.value=year.value.replace(/[０-９]/g,c=>String(c.charCodeAt(0)-0xFF10)).replace(/[^0-9]/g,'').slice(0,4);
  const count=daysInBirthMonth(year.value,month.value),prior=day.value;
  if(day.options.length!==count+1)day.innerHTML=options(count,Number(prior)<=count?prior:'','日');
  const result=birthDateFromParts(year.value,month.value,day.value);
  stored.value=result.date;
  year.setCustomValidity(year.value.length===4&&(Number(year.value)<1900||Number(year.value)>Number(identityToday().slice(0,4)))?'请填写1900年至今年之间的4位年份。':'');
  day.setCustomValidity(result.error&&year.validationMessage===''?result.error:'');
  const help=box.querySelector('[data-birth-help]');
  help.textContent=result.error||(prior&&!day.value?'日期已清空，请重新选择这个月的日期。':result.date?`已填写：${year.value}年${Number(month.value)}月${Number(day.value)}日`:'直接输入4位年份，再选择月、日。');
  help.classList.toggle('birth-date-error',Boolean(result.error));
  return result;
}
