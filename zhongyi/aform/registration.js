// A visible confirmation requires a server-verified, email-confirmed account.
// URL flags alone must never produce a success result.
async function within(promise, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('verification_timeout')), timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
}

export async function registrationOutcome(auth, callback = {}, timeoutMs = 10000) {
  if (callback.error) return {state: 'expired'};
  if (callback.signup && !callback.hasAccessToken) return {state: 'missing'};
  try {
    const sessionResult = await within(auth.getSession(), timeoutMs);
    if (sessionResult.error) {
      return {state: /expired|invalid|otp/i.test(sessionResult.error.code || '') ? 'expired' : 'retry'};
    }
    const session = sessionResult.data?.session;
    if (!session?.access_token || !session.user?.id) return {state: 'missing'};
    const verified = await within(auth.getUser(session.access_token), timeoutMs);
    if (verified.error) return {state: verified.error.status === 401 || verified.error.status === 403 ? 'expired' : 'retry'};
    const person = verified.data?.user;
    if (!person || person.id !== session.user.id) return {state: 'missing'};
    if (!person.email_confirmed_at) return {state: 'unconfirmed'};
    return {state: 'success', user: person};
  } catch { return {state: 'retry'}; }
}

export function registrationCopy(state) {
  return ({
    pending: ['正在确认邮箱', '请稍候，正在确认验证结果。'],
    success: ['注册成功', '邮箱验证已完成。请用注册时的邮箱和密码登录。'],
    expired: ['链接已使用或已过期', '如果您已经验证过邮箱，可以直接返回登录。尚未验证，请打开最新一封验证邮件。'],
    missing: ['请从验证邮件继续', '请打开注册时收到的邮件，点击验证链接。已经验证过邮箱，可以直接返回登录。'],
    unconfirmed: ['邮箱还未完成验证', '请打开注册时收到的邮件，点击验证链接，再回来登录。'],
    retry: ['暂时无法确认验证结果', '网络连接暂未完成，请重新确认。已经验证过邮箱，也可以直接返回登录。']
  })[state] || ['暂时无法确认验证结果', '请重新确认，或返回登录。'];
}
