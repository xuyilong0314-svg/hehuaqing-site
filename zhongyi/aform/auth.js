// Only the public application key belongs in this browser bundle.
export function publicApiFetch(key, fetcher = fetch, timeoutMs = 12000) {
  if (!key?.startsWith('sb_publishable_')) throw new Error('网站连接参数无效，请联系管理员。');
  return async (input, init = {}) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    // The gateway requires the publishable key in apikey, never as a user JWT.
    if (headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    const url = new URL(input instanceof Request ? input.url : input);
    if (!url.pathname.startsWith('/auth/v1/')) return fetcher(input, { ...init, headers });
    const controller = new AbortController();
    const signal = init.signal || (input instanceof Request ? input.signal : null);
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, {once:true});
    const timer = setTimeout(abort, timeoutMs);
    try { return await fetcher(input, { ...init, headers, signal:controller.signal }); }
    finally { clearTimeout(timer);signal?.removeEventListener('abort', abort); }
  };
}

export function authReturnUrl(location) {
  const url = new URL(location.origin + location.pathname);
  if (['www.hehuaqing.com', 'hehuaqing.com', 'xuyilong0314-svg.github.io'].includes(url.hostname)) {
    return 'https://www.hehuaqing.com/zhongyi/aform/';
  }
  return url.origin + url.pathname;
}

export function authCallback(hash, search = '') {
  const values = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  const hasError = values.has('error') || values.has('error_code') || query.has('error') || query.has('error_code');
  return {
    setup: ['invite', 'magiclink', 'recovery'].includes(values.get('type')) || hash === '#/activate',
    signup: values.get('type') === 'signup',
    hasAccessToken: Boolean(values.get('access_token')),
    // In memory only, used to verify this link rather than an older saved login.
    accessToken: values.get('access_token') || '',
    error: hasError ? '验证链接已过期或无法使用，请重新获取验证或重设密码邮件。' : '',
    received: values.has('access_token') || hasError
  };
}
