function messageFor(field) {
  if (field.validity.customError) return field.validationMessage;
  if (!field.validity.valueMissing) return '请检查此项的格式或填写范围。';
  const birthParts = {year:'出生年份', month:'出生月份', day:'出生日'};
  const part = birthParts[field.dataset.birthPart];
  if (part) return (field.tagName === 'SELECT' ? '请选择' : '请填写') + part + '。';
  if (field.type === 'checkbox') return '请勾选此项。';
  if (field.type === 'radio' || field.tagName === 'SELECT') return '请选择一项。';
  return '请填写此项。';
}

function fieldAnchor(field) {
  return field.closest('[data-birth-date]') ||
    (field.type === 'radio' && field.closest('.paper-choice')) ||
    field.closest('label, .password-control') || field;
}

export function installFormValidation(root = document) {
  const active = new WeakMap();
  let hintNumber = 0;

  const clear = form => {
    const entry = active.get(form);
    if (!entry) return;
    const {field, hint, marked, originalInvalid} = entry;
    marked.classList.remove('field-needs-attention');
    if (originalInvalid === null) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', originalInvalid);
    const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== hint.id);
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
    else field.removeAttribute('aria-describedby');
    hint.remove();
    active.delete(form);
  };

  root.addEventListener('invalid', event => {
    const field = event.target;
    const form = field.form;
    if (!form || !field.willValidate) return;
    // The browser still rejects the submission; the page supplies the focus and message.
    event.preventDefault();
    const first = Array.from(form.elements).find(control => control.willValidate && !control.validity.valid);
    if (first !== field) return;

    clear(form);
    for (let details = field.closest('details'); details; details = details.parentElement?.closest('details')) {
      details.open = true;
    }
    const anchor = fieldAnchor(field);
    const marked = field.type === 'radio' ? anchor : field;
    const hint = field.ownerDocument.createElement('span');
    hint.id = 'field-validation-' + ++hintNumber;
    hint.className = 'field-validation-hint';
    hint.setAttribute('role', 'alert');
    hint.textContent = messageFor(field);
    anchor.after(hint);
    active.set(form, {field, hint, marked, originalInvalid:field.getAttribute('aria-invalid')});
    const previousHint = field.getAttribute('aria-describedby');
    field.setAttribute('aria-describedby', previousHint ? previousHint + ' ' + hint.id : hint.id);
    field.setAttribute('aria-invalid', 'true');
    marked.classList.add('field-needs-attention');
    field.focus({preventScroll:true});
    anchor.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'});
  }, true);

  const clearAfterEdit = event => {
    const form = event.target.form;
    if (!form || !active.has(form)) return;
    // Allow compound inputs such as the birthday controls to update validity first.
    queueMicrotask(() => {
      const field = active.get(form)?.field;
      if (field?.validity.valid) clear(form);
    });
  };
  root.addEventListener('input', clearAfterEdit);
  root.addEventListener('change', clearAfterEdit);
}
