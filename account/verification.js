// Email confirmation only. Never log or persist verification tokens.
const pendingKey = 'hhq-pending-signup-email';
export function rememberPendingEmail(email, storage) {
  try { (storage || globalThis.sessionStorage)?.setItem(pendingKey, String(email || '').trim()); } catch {}
}
export function pendingEmail(storage) {
  try { return (storage || globalThis.sessionStorage)?.getItem(pendingKey) || ''; } catch { return ''; }
}
export function forgetPendingEmail(storage) {
  try { (storage || globalThis.sessionStorage)?.removeItem(pendingKey); } catch {}
}
export function verificationUrl(location) {
  const base = new URL(location.href || location.origin + location.pathname);
  if (['www.hehuaqing.com', 'hehuaqing.com', 'xuyilong0314-svg.github.io'].includes(base.hostname)) return 'https://www.hehuaqing.com/account/verify/';
  return new URL('/account/verify/', base).href;
}
export function readVerificationLink(location) {
  const hash = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
  const query = new URLSearchParams(location.search || '');
  const token = hash.get('token_hash') || query.get('token_hash') || '';
  const type = hash.get('type') || query.get('type') || '';
  if (!token) return null;
  if (!['email', 'signup', 'magiclink'].includes(type) || !/^[a-f0-9]{40,128}$/i.test(token)) return {invalid: true};
  return {token_hash: token, type: 'email'};
}
export function linkCredentials(value) {
  const invalid = () => Object.assign(Error('请长按邮件里的验证按钮，复制完整链接后再粘贴。'), {code: 'confirmation_input'});
  let url; try { url = new URL(String(value || '').trim()); } catch { throw invalid(); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw invalid();
  if (url.hostname === 'www.hehuaqing.com' && url.pathname === '/account/verify/') {
    const parsed = readVerificationLink(url); if (parsed && !parsed.invalid) return parsed;
  }
  if (url.hostname !== 'mdwbtgjyrdqfwupvadir.supabase.co' || url.pathname !== '/auth/v1/verify') throw invalid();
  const token = url.searchParams.get('token') || url.searchParams.get('token_hash') || '';
  const type = url.searchParams.get('type');
  if (!['email', 'signup', 'magiclink'].includes(type) || !/^[a-f0-9]{40,128}$/i.test(token)) throw invalid();
  return {token_hash: token, type: 'email'};
}
export async function confirmEmail(auth, credentials) {
  const result = await auth.verifyOtp(credentials);
  if (result.error) throw result.error;
  const session = result.data?.session;
  if (!session?.access_token || !session.user?.id) throw Object.assign(Error('verification_session_missing'), {code: 'confirmation_incomplete'});
  const verified = await auth.getUser(session.access_token);
  if (verified.error) throw verified.error;
  const user = verified.data?.user;
  if (!user || user.id !== session.user.id || !user.email_confirmed_at || (credentials.email && user.email?.toLowerCase() !== credentials.email.toLowerCase())) {
    throw Object.assign(Error('verification_identity_mismatch'), {code: 'confirmation_incomplete'});
  }
  return user;
}
export async function resendConfirmation(auth, email, redirectTo) {
  email = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(Error('请填写注册时使用的邮箱。'), {code: 'confirmation_input'});
  const result = await auth.resend({type: 'signup', email, options: {emailRedirectTo: redirectTo}});
  if (result.error) throw result.error;
}
export function confirmationError(error) {
  if (error?.code === 'confirmation_input') return error.message;
  if (['otp_expired', 'otp_disabled', 'validation_failed'].includes(error?.code)) return '验证链接已失效。若已经验证过，请直接登录；否则重新发送验证邮件，并使用最新一封。';
  if (error?.status === 429 || String(error?.code || '').startsWith('over_')) return '发送或验证过于频繁，请稍后使用原邮箱再试。';
  if (error?.code === 'confirmation_incomplete') return '暂时未能确认登录状态。若邮箱已验证，请用原邮箱和密码登录。';
  if (error?.code === 'email_address_not_authorized') return '邮件服务暂时无法发送，请联系网站管理员。';
  return '暂时连接不到账号服务，请稍后重试。也可在手机浏览器中打开本页面重试。';
}
