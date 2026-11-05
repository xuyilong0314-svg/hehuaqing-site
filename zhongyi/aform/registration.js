// A visible success requires a server-verified active login session.
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
    return {state: 'success', user: person};
  } catch { return {state: 'retry'}; }
}

export function registrationCopy(state) {
  return ({
    pending: ['正在确认账号', '请稍候，正在完成登录。'],
    success: ['注册成功', '已为您登录，可以直接开始阅读和记录。'],
    expired: ['链接已使用或已过期', '现在注册后即可直接登录。请返回登录；忘记密码时，可用注册邮箱找回。'],
    missing: ['请登录继续', '使用注册时的邮箱和密码登录，无需验证邮箱。'],
    retry: ['暂时无法确认登录状态', '网络连接暂未完成，请重新确认，也可以返回登录。']
  })[state] || ['暂时无法确认登录状态', '请重新确认，或返回登录。'];
}
