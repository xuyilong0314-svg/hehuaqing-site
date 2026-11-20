// One Gregorian birthday control for signup, account profiles and health intake.
const today = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = value => String(value).padStart(2, '0');
export function daysInBirthMonth(year, month) {
  const y = Number(year), m = Number(month);
  if (m === 2) return !/^\d{4}$/.test(String(year)) || y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}
export function birthDateFromParts(year, month, day, limit = today()) {
  const y = String(year).trim(), m = Number(month), d = Number(day);
  if (!/^\d{4}$/.test(y) || Number(y) < 1900 || Number(y) > Number(limit.slice(0, 4))) return {date:'', error:y.length === 4 ? '年份应在1900年至今年之间。' : ''};
  if (!month || !day) return {date:'', error:''};
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > daysInBirthMonth(y, m)) return {date:'', error:'这个月没有所选日期，请重新选择。'};
  const date = `${y}-${pad(m)}-${pad(d)}`;
  return date > limit ? {date:'', error:'出生日期不能晚于今天。'} : {date, error:''};
}
const options = (count, value, unit) => '<option value="">'+unit+'</option>'+Array.from({length:count}, (_, i) => `<option value="${i+1}"${Number(value) === i+1 ? ' selected' : ''}>${i+1}${unit}</option>`).join('');
export function birthDateField(value = '', prefix = 'birth') {
  const [year = '', month = '', day = ''] = String(value).split('-'), id = esc(prefix);
  const valid = birthDateFromParts(year, month, day).date;
  return `<fieldset class="field profile-field birth-date-field" data-birth-date><legend class="label">出生年月日（公历） <span class="profile-required gold">必填</span></legend><div class="birth-date-parts"><label for="${id}-year"><span>年</span><input class="input" id="${id}-year" name="birth_year" data-birth-part="year" type="text" inputmode="numeric" autocomplete="bday-year" pattern="[0-9]{4}" maxlength="4" placeholder="如 1968" value="${esc(year)}" required aria-describedby="${id}-help"></label><label for="${id}-month"><span>月</span><select id="${id}-month" name="birth_month" data-birth-part="month" autocomplete="bday-month" required aria-describedby="${id}-help">${options(12,month,'月')}</select></label><label for="${id}-day"><span>日</span><select id="${id}-day" name="birth_day" data-birth-part="day" autocomplete="bday-day" required aria-describedby="${id}-help">${options(daysInBirthMonth(year,month),day,'日')}</select></label></div><input type="hidden" name="birth_date" value="${esc(valid)}"><p class="help" id="${id}-help" data-birth-help aria-live="polite">直接输入4位年份，再选择月、日。</p></fieldset>`;
}
// Preserve the existing ISO save contract. Never turn an invalid day into a different birthday.
export function syncBirthDate(form, {fromValue = false} = {}) {
  const box = form?.querySelector?.('[data-birth-date]'); if (!box) return;
  const year = form.elements.birth_year, month = form.elements.birth_month, day = form.elements.birth_day, stored = form.elements.birth_date;
  if (fromValue) {
    const p = stored.value.split('-'); year.value = p[0] || ''; month.value = p[1] ? String(Number(p[1])) : '';
    day.innerHTML = options(daysInBirthMonth(year.value,month.value),p[2] || '','日');
  }
  year.value = year.value.replace(/[０-９]/g, c => String(c.charCodeAt(0)-0xFF10)).replace(/[^0-9]/g, '').slice(0,4);
  const count = daysInBirthMonth(year.value,month.value), prior = day.value;
  if (day.options.length !== count+1) day.innerHTML = options(count,Number(prior) <= count ? prior : '','日');
  const result = birthDateFromParts(year.value,month.value,day.value);
  stored.value = result.date;
  const yearError = year.value && (!/^\d{4}$/.test(year.value) || Number(year.value) < 1900 || Number(year.value) > Number(today().slice(0,4)));
  year.setCustomValidity(yearError ? '请填写1900年至今年之间的4位年份。' : '');
  day.setCustomValidity(!yearError ? result.error : '');
  const help = box.querySelector('[data-birth-help]');
  help.textContent = result.error || (prior && !day.value ? '日期已清空，请重新选择这个月的日期。' : result.date ? `已填写：${year.value}年${Number(month.value)}月${Number(day.value)}日` : '直接输入4位年份，再选择月、日。');
  help.classList.toggle('birth-date-error',Boolean(result.error));
  return result;
}
