import {birthDateField, daysInBirthMonth, birthDateFromParts, syncBirthDate as syncSharedBirthDate} from '../../account/birth-date.js?v=20261120-mobile-save-1';
import {identityToday} from '../../account/identity.js?v=20261120-mobile-save-1';

export {birthDateField, daysInBirthMonth, birthDateFromParts};

export function ageFromBirthDate(birthDate, referenceDate = identityToday()) {
  const value = String(birthDate ?? '').trim();
  const [year, month, day] = value.split('-');
  if (!value || birthDateFromParts(year, month, day, referenceDate).date !== value) return null;

  const birthdayPending = referenceDate.slice(5) < value.slice(5);
  return Number(referenceDate.slice(0, 4)) - Number(year) - (birthdayPending ? 1 : 0);
}

export function syncBirthDate(form, options) {
  const result = syncSharedBirthDate(form, options);
  const output = form?.querySelector?.('[data-case-age]');
  if (output) {
    const age = String(ageFromBirthDate(result?.date) ?? '—');
    if (output.value !== age) output.value = age;
  }
  return result;
}
