// The same birth-date and mobile-number rules apply to registration and intake.
const clean = value => String(value ?? '').trim();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function identityToday(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}
export function normalizePhone(value) {
  let phone = clean(value).replace(/[\s()-]/g, '');
  if (/^\+861[3-9]\d{9}$/.test(phone)) phone = phone.slice(3);
  return phone;
}
export function validPhone(value) {
  return /^(?:1[3-9]\d{9}|\+[1-9]\d{7,14})$/.test(normalizePhone(value));
}
export function normalizeIdentity(values, today = identityToday()) {
  const birth_date = clean(values.birth_date), phone = normalizePhone(values.phone);
  if (!birth_date) throw Error('请填写出生年月日。');
  const d = new Date(birth_date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== birth_date || birth_date < '1900-01-01' || birth_date > today) throw Error('请填写正确的出生年月日，不能晚于今天。');
  if (!phone) throw Error('请填写手机号。');
  if (!validPhone(phone)) throw Error('请填写正确的手机号：大陆手机号填 11 位，其他地区请加国际区号（如 +852）。');
  return {birth_date, phone};
}
export function identityFields(profile = {}, prefix = 'personal') {
  return `<label class="field profile-field" for="${prefix}-birth">出生年月日（公历） <span class="profile-required">必填</span><input id="${prefix}-birth" name="birth_date" type="date" value="${esc(profile.birth_date)}" min="1900-01-01" max="${identityToday()}" required autocomplete="bday"></label>
  <label class="field profile-field" for="${prefix}-phone">手机号 <span class="profile-required">必填</span><input id="${prefix}-phone" name="phone" type="tel" value="${esc(profile.phone)}" required maxlength="24" autocomplete="tel" inputmode="tel" placeholder="大陆 11 位手机号；其他地区加国际区号"></label>${birthSummary(profile.birth_date)}`;
}
// Old optional contact fields may also contain WeChat IDs or notes: preserve them.
export function caseIdentity(record = {}) {
  return {birth_date: record.birth_date || '', phone: record.phone || (validPhone(record.contact) ? normalizePhone(record.contact) : '')};
}
// Only the explicit self-record mode can use the signed-in person's profile.
// Track auto-filled values so switching back never leaks the provider's details.
export function syncCaseIdentity(form, profile) {
  if (form.dataset.id) return;
  const own = form.elements.kind.value === 'self';
  for (const [key, value] of Object.entries({name:profile.display_name, birth_date:profile.birth_date, phone:profile.phone})) {
    const field = form.elements[key];
    if (own && !field.value && value) { field.value = value; field.dataset.identityAutofill = value; }
    if (!own && field.dataset.identityAutofill) {
      if (field.value === field.dataset.identityAutofill) field.value = '';
      delete field.dataset.identityAutofill;
    }
  }
}

// Conventional Gregorian date ranges, not a birth-chart calculation.
export function zodiacFromBirth(value) {
  const date=String(value||''), parsed=new Date(date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date<'1900-01-01'||date>identityToday())return '';
  const md=Number(date.slice(5,7))*100+Number(date.slice(8));
  const boundaries=[[120,'水瓶座'],[219,'双鱼座'],[321,'白羊座'],[420,'金牛座'],[521,'双子座'],[621,'巨蟹座'],[723,'狮子座'],[823,'处女座'],[923,'天秤座'],[1023,'天蝎座'],[1122,'射手座'],[1222,'摩羯座']];
  let sign='摩羯座';for(const [start,label] of boundaries){if(md<start)break;sign=label;}return sign;
}
export function birthdayNumber(birth_date) {
  if(!zodiacFromBirth(birth_date))return null;
  let sum=String(birth_date).replace(/-/g,'').split('').reduce((total,digit)=>total+Number(digit),0);
  while(sum>9)sum=String(sum).split('').reduce((total,digit)=>total+Number(digit),0);
  return sum;
}
export function birthBadges({zodiac,birthday_number}={}) {
  return (zodiac?`<span class="birth-badge">${esc(zodiac)}</span>`:'')+(Number.isInteger(birthday_number)&&birthday_number>=1&&birthday_number<=9?`<span class="birth-badge" title="公历生日各位数字相加至一位数">九型数字 · ${birthday_number} 号（生日算法）</span>`:'');
}
export function birthSummary(birth_date,{compact=false}={}) {
  const zodiac=zodiacFromBirth(birth_date), birthday_number=birthdayNumber(birth_date);
  if(compact)return birthBadges({zodiac,birthday_number});
  return `<div class="birth-summary" data-birth-summary aria-live="polite">${zodiac?`<strong>${birthBadges({zodiac,birthday_number})}</strong><small>星座按公历常用日期划分，交界日期仅供参考。九型数字按年月日各位相加至 1—9，不等同九型人格测评。</small>`:'<span>填写公历出生年月日后，自动显示星座和九型数字（生日算法）。</span>'}</div>`;
}
export function syncBirthSummary(form) {
  const summary=form?.querySelector('[data-birth-summary]'),field=form?.elements?.birth_date;
  if(summary&&field){const html=birthSummary(field.value);summary.innerHTML=html.slice(html.indexOf('>')+1,html.lastIndexOf('</div>'));}
}
