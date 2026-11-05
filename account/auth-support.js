// Only public error categories and anonymous connection checks. No credentials are retained.
export const isWeChat = (ua = '') => /MicroMessenger/i.test(ua);

export function authIssue(error) {
  const code = String(error?.code || '').toLowerCase();
  const name = String(error?.name || '');
  const message = String(error?.message || '');
  const status = Number(error?.status) || 0;
  const issue = (reference, text, connection = false) => ({reference, text, connection});
  if (code === 'client_load_failed') return issue('AUTH-CLIENT-LOAD', '账号组件没有加载完成。填写的内容还在，请重新连接后再试。', true);
  if (code === 'client_config_invalid' || /网站连接参数无效/.test(message)) return issue('AUTH-CLIENT-CONFIG', '账号连接配置未更新，请刷新页面后再试。', true);
  if (code === 'client_init_failed') return issue('AUTH-CLIENT-INIT', '账号组件暂时未能启动。请重新连接；仍不成功时可在手机浏览器中打开。', true);
  if (['email_exists','user_already_exists'].includes(code) || /already.*registered|already.*exists/i.test(message)) return issue('AUTH-EXISTS', '这个邮箱已经注册，请直接登录。忘记密码时，可用原邮箱找回。');
  if (code === 'invalid_credentials' || /Invalid login/i.test(message)) return issue('AUTH-CREDENTIALS', '邮箱或密码不正确，请重新输入。');
  if (code === 'email_not_confirmed' || /Email not confirmed/i.test(message)) return issue('AUTH-EMAIL-STATE', '请打开注册邮箱中的验证邮件，点击链接后再登录。');
  if (['email_address_invalid','validation_failed','bad_json'].includes(code) || /Unable to validate email|invalid email/i.test(message)) return issue('AUTH-INPUT', '请检查邮箱地址和填写内容，确认没有多余空格或中文符号。');
  if (code === 'weak_password' || /weak_password|pwned|Password is known/i.test(message)) return issue('AUTH-PASSWORD', '这个密码暂时无法使用，请换一个至少 6 位的密码，两次输入保持一致。');
  if (code === 'password_too_short' || /password.*at least|password.*short/i.test(message)) return issue('AUTH-PASSWORD', '密码至少需要 6 位，两次输入保持一致。');
  if (code.startsWith('over_') || status === 429 || /rate limit|too many/i.test(message)) return issue('AUTH-RATE-LIMIT', '操作较频繁，请稍后再试，不用换邮箱重新注册。');
  if (['signup_disabled','email_provider_disabled'].includes(code)) return issue('AUTH-SIGNUP-DISABLED', '注册服务暂时不可用，请稍后再试。');
  if (code === 'captcha_failed') return issue('AUTH-CAPTCHA', '账号安全检查未通过，请稍后重试。');
  if (code === 'email_address_not_authorized') return issue('AUTH-MAIL-SERVICE', '邮件服务暂时无法处理，请联系网站管理员。');
  if (status >= 500 || ['unexpected_failure','hook_timeout','hook_timeout_after_retry'].includes(code) || /Database error/i.test(message)) return issue('AUTH-SERVICE', '账号服务暂时异常，填写的内容已保留。请稍后再试。', true);
  if (name === 'AuthRetryableFetchError' || name === 'AbortError' || name === 'TimeoutError' || code === 'request_timeout' || /Failed to fetch|Load failed|NetworkError|network request|连接未成功|timed? ?out/i.test(message)) return issue('AUTH-CONNECTION', '暂时连接不到账号服务，填写的内容已保留。请先检查连接，再使用原邮箱重试。', true);
  if (/LockAcquireTimeout|NavigatorLockAcquireTimeout/.test(name) || /acquir.*lock/i.test(message)) return issue('AUTH-BROWSER-BUSY', '账号连接正被另一页面使用，请关闭其他登录页后重试。', true);
  return issue('AUTH-UNEXPECTED' + (status ? '-' + status : ''), '暂时未能完成，填写的内容已保留。请检查账号连接，并将下方问题编号告知管理员。', true);
}

export async function checkAuthConnection(config, fetcher = fetch, timeoutMs = 8000) {
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(new URL('/auth/v1/settings', config.url).href, {
      method: 'GET', headers: {apikey: config.key, Accept: 'application/json'},
      signal: controller.signal, cache: 'no-store', credentials: 'omit'
    });
    if (!response.ok) return {ok: false, reference: 'CHECK-HTTP-' + response.status, text: '账号服务有响应，但暂时无法正常使用，请稍后重试。'};
    const settings = await response.json();
    if (settings.disable_signup || settings.external?.email !== true) return {ok: false, reference: 'CHECK-SIGNUP-OFF', text: '已连通账号服务，但邮箱注册暂未开放。'};
    return {ok: true, reference: 'CHECK-OK', text: settings.mailer_autoconfirm ? '已连通账号服务，邮箱注册已开放。请使用原邮箱继续。' : '已连通账号服务，邮箱注册已开放。注册后请打开邮箱中的验证链接。', elapsedMs: Date.now() - started};
  } catch (error) {
    return {ok: false, reference: controller.signal.aborted ? 'CHECK-TIMEOUT' : 'CHECK-CONNECTION', text: '这个页面暂时无法连通账号服务。可切换网络，或从微信右上角“⋯”选择在浏览器中打开后重试。'};
  } finally { clearTimeout(timer); }
}
