import {birthDateField, daysInBirthMonth, birthDateFromParts, syncBirthDate as syncSharedBirthDate} from '../../account/birth-date.js?v=20261120-mobile-save-1';
import {ageFromBirthDate} from '../../account/identity.js?v=20261121-member-age-1';

export {birthDateField, daysInBirthMonth, birthDateFromParts, ageFromBirthDate};

export function syncBirthDate(form, options) {
  const result = syncSharedBirthDate(form, options);
  const output = form?.querySelector?.('[data-case-age]');
  if (output) {
    const age = String(ageFromBirthDate(result?.date) ?? '—');
    if (output.value !== age) output.value = age;
  }
  return result;
}
