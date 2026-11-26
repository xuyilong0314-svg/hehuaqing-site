import {esc} from './core.js?v=20261121-save-compat-1';
import {planEdition,planStamp,planTitle,planUsageLabel} from './case-workspace.js?v=20261126-paper-entry-1';

const optionLabel = entry => esc(planEdition(entry)) + (entry.savedAt ? ' · 保存于 ' + planStamp(entry.savedAt) : '');
const usageRow = entry => '<span class="plan-share-period">' + esc(planUsageLabel(entry)) + '</span>';
const summary = entry => '<li><strong>' + esc(planTitle(entry)) + '</strong>' + usageRow(entry) + '<small>' + optionLabel(entry) + '</small></li>';

export function choosePlanShare(entries, current) {
  const stages = new Map();
  for (const entry of entries) {
    if (!stages.has(entry.stage)) stages.set(entry.stage, []);
    stages.get(entry.stage).push(entry);
  }
  const groups = [...stages.values()];
  const latest = groups.map(group => group.at(-1));
  const canCompare = latest.length >= 2;
  const compareRows = groups.map(group => {
    const recent = group.at(-1);
    const checked = recent.stage === current.stage;
    const initial = checked ? current : recent;
    const versions = group.slice().reverse().map(entry =>
      '<option value="' + entry.number + '"' + (entry === initial ? ' selected' : '') + '>' + optionLabel(entry) + '</option>').join('');
    return '<li><label class="plan-share-check"><input type="checkbox"' + (checked ? ' checked' : '') +
      '><strong>' + esc(planTitle(recent)) + '</strong></label>' +
      usageRow(initial) + (group.length === 1 ? '<small>' + optionLabel(recent) + '</small>' :
      '<select aria-label="' + esc(planTitle(recent) + '的版本') + '">' + versions + '</select>') + '</li>';
  }).join('');
  const opener = document.activeElement;
  const modal = document.createElement('dialog');
  modal.className = 'plan-share-dialog';
  modal.setAttribute('aria-labelledby', 'plan-share-title');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `<form>
    <h2 id="plan-share-title">选择要分享的方案</h2>
    <fieldset class="plan-share-modes">
      <legend>分享范围</legend>
      <label><input type="radio" name="scope" value="single" checked>当前方案</label>
      <label><input type="radio" name="scope" value="all">全部方案</label>
      <label><input type="radio" name="scope" value="compare"${canCompare ? '' : ' disabled'}>多套对比</label>
    </fieldset>
    ${canCompare ? '' : '<p class="plan-share-help">保存两套方案后可生成对比图。</p>'}
    <div data-plan-share-scope="single"><ul class="plan-share-entries">${summary(current)}</ul></div>
    <div data-plan-share-scope="all" hidden>
      <p class="plan-share-help">共 ${latest.length} 套，每套选用最新保存的版本。</p>
      <ul class="plan-share-entries">${latest.map(summary).join('')}</ul>
    </div>
    <div data-plan-share-scope="compare" hidden>
      <p class="plan-share-help" role="status"></p>
      <ul class="plan-share-entries">${compareRows}</ul>
    </div>
    <div class="dialog-actions">
      <button class="btn secondary" type="button">取消</button>
      <button class="btn" type="submit">生成图片</button>
    </div>
  </form>`;
  const form = modal.querySelector('form');
  const confirm = form.querySelector('button[type=submit]');
  const comparePanel = form.querySelector('[data-plan-share-scope=compare]');
  const compareRowsInOrder = [...comparePanel.querySelectorAll('li')].map((row, index) => ({
    checkbox: row.querySelector('input'),
    version: row.querySelector('select'),
    period: row.querySelector('.plan-share-period'),
    group: groups[index]
  }));
  function selection() {
    const mode = form.elements.scope.value;
    const comparing = mode === 'compare';
    const chosen = [];
    for (const {checkbox,version,period,group} of compareRowsInOrder) {
      const entry = version ? group[Number(version.value) - 1] : group[0];
      if (version) version.disabled = !comparing || !checkbox.checked;
      period.textContent = planUsageLabel(entry);
      if (checkbox.checked) chosen.push(entry);
    }
    for (const panel of form.querySelectorAll('[data-plan-share-scope]')) {
      panel.hidden = panel.dataset.planShareScope !== mode;
    }
    comparePanel.querySelector('[role=status]').textContent = '已选 ' + chosen.length + ' 套' + (chosen.length < 2 ? '，请至少选择两套。' : '。');
    confirm.disabled = comparing && chosen.length < 2;
    return {mode,entries: comparing ? chosen : mode === 'all' ? latest : [current]};
  }
  return new Promise(resolve => {
    function finish(result) {
      if (!modal.isConnected) return;
      modal.remove();
      window.removeEventListener('hashchange', cancel);
      if (opener?.isConnected) opener.focus({preventScroll:true});
      resolve(result);
    }
    const cancel = () => finish(null);
    form.addEventListener('change', selection);
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopPropagation();
      const selected = selection();
      if (!confirm.disabled) finish(selected);
    });
    form.querySelector('button[type=button]').addEventListener('click', cancel);
    modal.addEventListener('close', cancel, {once:true});
    modal.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      cancel();
    });
    window.addEventListener('hashchange', cancel);
    document.body.append(modal);
    if (typeof modal.showModal === 'function') modal.showModal();
    else {
      modal.setAttribute('open', '');
      modal.setAttribute('role', 'dialog');
      modal.classList.add('plan-share-fallback');
    }
    selection();
    form.querySelector('input:checked').focus({preventScroll:true});
  });
}
