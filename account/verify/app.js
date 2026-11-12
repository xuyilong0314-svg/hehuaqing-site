import {ANALYTICS_URL, ANALYTICS_KEY} from '../../analytics/config.js?v=20261031-20';
import {publicApiFetch, authReturnUrl} from '../../zhongyi/aform/auth.js';
import {pendingEmail, rememberPendingEmail, forgetPendingEmail, readVerificationLink, linkCredentials, confirmEmail, resendConfirmation, confirmationError} from '../verification.js?v=20261112-verify-1';
const $ = id => document.getElementById(id);
let link = readVerificationLink(location), client, busy = false, resendAt = 0;
// Capture once in memory, then remove any credential from the address bar.
if (location.hash || location.search) history.replaceState(null, '', location.pathname);
$('email').value = pendingEmail();
if (link && !link.invalid) { $('link-confirm').hidden = false; $('intro').textContent = '请点击下方按钮，确认这是您本人的注册邮箱。'; }
if (link?.invalid) notice('这条验证链接不完整，请重新发送验证邮件。', true);
function notice(text, error = false) { $('notice').hidden = false; $('notice').className = error ? 'error' : ''; $('notice').textContent = text; }
function buttons() {
  document.querySelectorAll('button').forEach(b => { b.disabled = busy; });
  const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
  $('resend').disabled = busy || remaining > 0;
  $('resend').textContent = remaining ? remaining + ' 秒后可重新发送' : '重新发送验证邮件';
}
function getAuth() {
  if (!client) {
    if (typeof window.supabase?.createClient !== 'function') throw Error('client_load_failed');
    const timedFetch = async (input, init = {}) => {
      const controller = new AbortController(), abort = () => controller.abort();
      const timer = setTimeout(abort, 15000);
      init.signal?.addEventListener('abort', abort, {once: true});
      if (init.signal?.aborted) abort();
      try { return await fetch(input, {...init, signal: controller.signal}); }
      finally { clearTimeout(timer); init.signal?.removeEventListener('abort', abort); }
    };
    client = window.supabase.createClient(ANALYTICS_URL, ANALYTICS_KEY, {global: {fetch: publicApiFetch(ANALYTICS_KEY, timedFetch)}, auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false}});
  }
  return client.auth;
}
function success() {
  link = null; forgetPendingEmail(); $('code').value = '';
  $('title').textContent = '注册成功'; document.title = '注册成功 · 何华清';
  $('intro').textContent = '邮箱已验证，已为您登录。';
  $('notice').hidden = true; $('link-confirm').hidden = true; $('forms').hidden = true; $('login-help').hidden = true; $('success').hidden = false;
  document.querySelector('.mark').textContent = '✓'; $('title').focus();
}
async function run(action) {
  if (busy) return; busy = true; buttons();
  try { await action(); } catch (error) { notice(confirmationError(error), true); }
  finally { busy = false; buttons(); }
}
$('confirm-link').addEventListener('click', () => run(async () => {
  if (!link || link.invalid) throw {code: 'otp_expired'};
  notice('正在验证邮箱，请稍候…'); await confirmEmail(getAuth(), link); success();
}));
$('code-form').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    const credentials = linkCredentials($('code').value);
    notice('正在验证邮箱，请稍候…');
    await confirmEmail(getAuth(), credentials); success();
  });
});
$('resend').addEventListener('click', () => {
  if (Date.now() < resendAt) return;
  run(async () => {
    await resendConfirmation(getAuth(), $('email').value, authReturnUrl(location));
    rememberPendingEmail($('email').value); resendAt = Date.now() + 60000;
    notice('请求已提交。如果这个邮箱仍待验证，将收到一封新的验证邮件，请查看收件箱和垃圾箱。若已验证，请直接返回登录。');
  });
});
setInterval(buttons, 1000);
