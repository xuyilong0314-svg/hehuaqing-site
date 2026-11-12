// Website and health archives use the same authenticated user's personal profile.
// Auth user metadata is the shared source; existing name/class tables are projections
// for the member list, never a source of permissions.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = value => String(value ?? '').trim();
export class ProfileError extends Error {
  constructor(message, partial = false) { super(message); this.name = 'ProfileError'; this.partial = partial; }
}
export function normalizeProfile(values) {
  const display_name = clean(values.display_name).replace(/\s+/g, ' ');
  const location = clean(values.location);
  const has_studied = values.has_studied === true || values.has_studied === 'yes' ? true : values.has_studied === false || values.has_studied === 'no' ? false : null;
  let class_name = has_studied === false ? '' : clean(values.class_name);
  if (!display_name || display_name.length > 40 || !/^[\p{L}\p{M}][\p{L}\p{M} .·•・’'-]*$/u.test(display_name)) throw new ProfileError('请填写真实姓名（最多 40 字），请勿使用网名、表情或数字。');
  if (location.length > 80) throw new ProfileError('所在地请填写省、市或地区，最多 80 字。');
  if (has_studied === null) throw new ProfileError('请选择是否参加过古中医阴阳五行舌学习。');
  if (has_studied && (!class_name || class_name.length > 80 || !/[1-9一二三四五六七八九十百壹贰叁肆伍陆柒捌玖拾]/.test(class_name))) throw new ProfileError('参加过学习的，请填写第几期；复训可填写多个期数。');
  if (/^[1-9]\d*$/.test(class_name)) class_name = '第' + class_name + '期';
  return {display_name, location, has_studied, class_name, profile_version: 1};
}
// Registration keeps the name requirement; detailed study information is completed later.
export function signupFields(prefix='signup') {
  return `<label class="field profile-field" for="${prefix}-name">真实姓名<input id="${prefix}-name" name="display_name" type="text" required maxlength="40" autocomplete="name" placeholder="请填写真实姓名"></label>`;
}
export function signupProfileFromForm(form) {
  const name=clean(new FormData(form).get('display_name')).replace(/\s+/g,' ');
  const checked=normalizeProfile({display_name:name,location:'',has_studied:false,class_name:''});
  return {display_name:checked.display_name};
}
export function profileFromForm(form) {
  const data = new FormData(form);
  return normalizeProfile(Object.fromEntries(['display_name','location','has_studied','class_name'].map(key => [key, data.get(key)])));
}
export function resolveProfile(user, legacy = {}) {
  const meta = user?.user_metadata || {};
  if (meta.profile_version === 1) return {
    display_name: clean(meta.display_name), location: clean(meta.location),
    has_studied: typeof meta.has_studied === 'boolean' ? meta.has_studied : null,
    class_name: meta.has_studied === false ? '' : clean(meta.class_name), profile_version: 1
  };
  const class_name = clean(legacy.class_name || meta.class_name);
  return {display_name: clean(legacy.display_name || meta.display_name), location: clean(meta.location), has_studied: class_name ? true : null, class_name, profile_version: 0};
}
export function profileFields(profile = {}, prefix = 'personal') {
  const studied = profile.has_studied === true ? 'yes' : profile.has_studied === false ? 'no' : '';
  return `<div class="profile-fields" data-profile-fields>
    <label class="profile-field" for="${prefix}-name">真实姓名 <span class="profile-required">必填</span><input id="${prefix}-name" name="display_name" type="text" value="${esc(profile.display_name)}" required maxlength="40" autocomplete="name" placeholder="请填写真实姓名" aria-describedby="${prefix}-name-help"></label>
    <p class="profile-help" id="${prefix}-name-help">必须使用真实姓名，请勿填写网名或昵称。</p>
    <label class="profile-field" for="${prefix}-location">所在地 <span class="profile-optional">选填</span><input id="${prefix}-location" name="location" type="text" value="${esc(profile.location)}" maxlength="80" autocomplete="address-level2" placeholder="例如：福建省泉州市" aria-describedby="${prefix}-location-help"></label>
    <p class="profile-help" id="${prefix}-location-help">填写省、市或地区即可，无需详细住址。</p>
    <label class="profile-field" for="${prefix}-studied">是否参加过古中医阴阳五行舌学习 <span class="profile-required">必选</span><select id="${prefix}-studied" name="has_studied" required data-study-choice aria-controls="${prefix}-course"><option value="" ${studied === '' ? 'selected' : ''}>请选择</option><option value="no" ${studied === 'no' ? 'selected' : ''}>尚未参加</option><option value="yes" ${studied === 'yes' ? 'selected' : ''}>已参加学习</option></select></label>
    <div id="${prefix}-course" data-course-field ${studied !== 'yes' ? 'hidden' : ''}><label class="profile-field" for="${prefix}-class">学习期数 <span class="profile-required">已学习者必填</span><input id="${prefix}-class" name="class_name" type="text" value="${esc(profile.class_name)}" maxlength="80" placeholder="例如：第六期；复训可填第四期、第六期" ${studied === 'yes' ? 'required' : 'disabled'} aria-describedby="${prefix}-course-help"></label><p class="profile-help" id="${prefix}-course-help">请按实际参加的期数填写。</p></div>
  </div>`;
}
export function syncStudyField(select) {
  const group = select.closest('[data-profile-fields]');
  if (!group) return;
  const enabled = select.value === 'yes', field = group.querySelector('[data-course-field]'), input = field.querySelector('input');
  field.hidden = !enabled; input.disabled = !enabled; input.required = enabled;
}
function result(response) { if (response.error) throw response.error; return response.data; }
async function synchronize(db, user, legacy) {
  const profile = resolveProfile(user, legacy);
  if (profile.profile_version !== 1) return profile;
  // Recheck before projecting self-entered metadata into existing tables.
  const normalized = normalizeProfile(profile);
  if (!legacy || legacy.display_name !== normalized.display_name || (legacy.class_name || '') !== normalized.class_name) {
    const saved = result(await db.from('profiles').update({display_name: normalized.display_name, class_name: normalized.class_name}).eq('id', user.id).select('id').single());
    if (saved?.id !== user.id) throw new Error('profile_sync_failed');
  }
  return normalized;
}
export async function readPersonalProfile(db, {legacy, expectedUserId} = {}) {
  const {user} = result(await db.auth.getUser());
  if (!user) throw new Error('login_required');
  if ((expectedUserId && user.id !== expectedUserId) || (legacy?.id && legacy.id !== user.id)) throw new Error('account_changed');
  if (legacy === undefined) legacy = result(await db.from('profiles').select('id,display_name,class_name').eq('id', user.id).maybeSingle());
  const profile = await synchronize(db, user, legacy);
  return {profile, user};
}
export async function savePersonalProfile(db, values) {
  const profile = normalizeProfile(values);
  let saved = false;
  try {
    const {user} = result(await db.auth.updateUser({data: profile}));
    if (!user) throw new Error('login_required');
    saved = true;
    const legacy = result(await db.from('profiles').select('id,display_name,class_name').eq('id', user.id).maybeSingle());
    await synchronize(db, user, legacy);
    return {profile, user};
  } catch (error) {
    if (saved) throw new ProfileError('个人资料已保存，姓名与期数的同步暂未完成。请再次点击“保存资料”重试。', true);
    throw error;
  }
}
