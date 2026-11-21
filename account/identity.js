import {birthDateField,birthDateFromParts} from './birth-date.js?v=20261120-mobile-save-1';
// The same birth-date and mobile-number rules apply to registration and intake.
const clean = value => String(value ?? '').trim();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function identityToday(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}
export function ageFromBirthDate(birthDate, referenceDate = identityToday()) {
  const value = String(birthDate ?? '').trim();
  const [year, month, day] = value.split('-');
  if (!value || birthDateFromParts(year, month, day, referenceDate).date !== value) return null;

  const birthdayPending = referenceDate.slice(5) < value.slice(5);
  return Number(referenceDate.slice(0, 4)) - Number(year) - (birthdayPending ? 1 : 0);
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
const genders = {male:'男', female:'女'};
export function normalizeGender(value) {
  const key = clean(value).toLowerCase();
  if (key === 'male' || key === '男') return 'male';
  if (key === 'female' || key === '女') return 'female';
  return '';
}
export function genderLabel(value) {
  return genders[normalizeGender(value)] || '';
}
export function genderField(value = '', prefix = 'personal') {
  const selected = normalizeGender(value), id = esc(prefix) + '-gender';
  const options = Object.entries(genders).map(([key,label]) =>
    `<option value="${key}"${key===selected?' selected':''}>${label}</option>`
  ).join('');
  return `<label class="field profile-field" for="${id}">性别
    <select class="input" id="${id}" name="gender"><option value="">未填写</option>${options}</select>
  </label>`;
}
export function genderBadge(value) {
  const label = genderLabel(value);
  return label ? `<span class="birth-badge" data-gender>${label}</span>` :
    '<span class="list-gender-unavailable">性别待填</span>';
}
export function identityFields(profile = {}, prefix = 'personal') {
  return `${birthDateField(profile.birth_date,prefix)}${genderField(profile.gender,prefix)}
  <label class="field profile-field" for="${prefix}-phone">手机号 <span class="profile-required">必填</span><input id="${prefix}-phone" name="phone" type="tel" value="${esc(profile.phone)}" required maxlength="24" autocomplete="tel" inputmode="tel" placeholder="大陆 11 位手机号；其他地区加国际区号"></label>${birthSummary(profile.birth_date,{showAge:true})}`;
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
  for (const [key, value] of Object.entries({name:profile.display_name, birth_date:profile.birth_date, phone:profile.phone, gender:normalizeGender(profile.gender)})) {
    const field = form.elements[key];
    if (!field) continue;
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
const digitSum = value => String(value).split('').reduce((total,digit)=>total+Number(digit),0);
function reduceDigits(value) { let n=Number(value);while(n>9)n=digitSum(n);return n; }
function additionStep(a,b) { let n=a+b, text=`${a}＋${b}＝${n}`;while(n>9){n=digitSum(n);text+=' → '+n;}return text; }
export function birthdayTriangle(birth_date) {
  if(!zodiacFromBirth(birth_date))return null;
  const parts=[birth_date.slice(8,10),birth_date.slice(5,7),birth_date.slice(0,2),birth_date.slice(2,4)];
  const base=parts.map(reduceDigits),middle=[reduceDigits(base[0]+base[1]),reduceDigits(base[2]+base[3])];
  return {parts,base,middle,result:reduceDigits(middle[0]+middle[1]),steps:[additionStep(base[0],base[1]),additionStep(base[2],base[3]),additionStep(middle[0],middle[1])]};
}
export function birthdayNumber(birth_date) { return birthdayTriangle(birth_date)?.result??null; }
export function birthDateLabel(birth_date) {
  return zodiacFromBirth(birth_date)?`${birth_date.slice(8,10)}日 ${birth_date.slice(5,7)}月 ${birth_date.slice(0,4)}年`:'';
}
export function triangleMarkup(birth_date) {
  const t=birthdayTriangle(birth_date);if(!t)return '';
  return `<section class="birth-calculation" aria-label="完整生日三角形"><p class="birth-date-caption">${birthDateLabel(birth_date)}</p><div class="birth-triangle"><svg viewBox="0 0 320 286" role="img" aria-label="${birthDateLabel(birth_date)}，生日三角算法：底层 ${t.base.join('、')}；中层 ${t.middle.join('、')}；结果 ${t.result} 号"><path d="M160 12 L16 218 L304 218 Z M112 80 H208 M66 146 H254 M160 80 V218 M88 146 V218 M232 146 V218"/><g class="triangle-numbers"><text x="160" y="58">${t.result}</text><text x="128" y="126">${t.middle[0]}</text><text x="192" y="126">${t.middle[1]}</text>${t.base.map((n,i)=>`<text x="${[58,124,196,262][i]}" y="193">${n}</text>`).join('')}</g><g class="triangle-parts">${t.parts.map((n,i)=>`<text x="${[58,124,196,262][i]}" y="242">${n}${i===0?'日':i===1?'月':''}</text>`).join('')}</g><path class="triangle-year-bracket" d="M178 250 V255 H280 V250"/><text class="triangle-year" x="229" y="277">${birth_date.slice(0,4)}年</text></svg></div><p class="birth-equations">${t.steps.map(step=>`<span>${step}</span>`).join('')}</p><small>日、月、年份前两位、年份后两位分别相加，再逐层相加；两位数继续拆开相加。</small></section>`;
}
export function birthBadges({zodiac,birthday_number,age_years}={}) {
  const age=Number.isInteger(age_years)&&age_years>=0?`<span class="birth-badge" data-age-years="${age_years}">${age_years} 周岁</span>`:'';
  return age+(zodiac?`<span class="birth-badge">${esc(zodiac)}</span>`:'')+(Number.isInteger(birthday_number)&&birthday_number>=1&&birthday_number<=9?`<span class="birth-badge" title="按公历生日三角加法计算">数字性格 · ${birthday_number} 号（生日算法）</span>`:'');
}
export function birthSummary(birth_date,{compact=false,showAge=false}={}) {
  const zodiac=zodiacFromBirth(birth_date);
  const badges=birthBadges({zodiac,age_years:showAge?ageFromBirthDate(birth_date):null});
  if(compact)return badges;
  return `<div class="birth-summary" data-birth-summary${showAge?' data-show-age':''} aria-live="polite">${zodiac?`<strong>${badges}</strong><p class="birth-date-caption">${birthDateLabel(birth_date)}</p><small>星座按公历常用日期划分，交界日期仅供参考。数字性格在获授权的专属页面查看。</small>`:'<span>请填写公历出生年月日。</span>'}</div>`;
}
export function syncBirthSummary(form) {
  const summary=form?.querySelector('[data-birth-summary]'),field=form?.elements?.birth_date;
  if(summary&&field){const html=birthSummary(field.value,{showAge:summary.hasAttribute('data-show-age')});summary.innerHTML=html.slice(html.indexOf('>')+1,html.lastIndexOf('</div>'));}
}
