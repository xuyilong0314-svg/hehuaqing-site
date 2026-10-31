// Only the public application key belongs in this browser bundle.
export function publicApiFetch(key, fetcher = fetch) {
  if (!key?.startsWith('sb_publishable_')) throw new Error('网站连接参数无效，请联系管理员。');
  return (input, init = {}) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    // The gateway requires the publishable key in apikey, never as a user JWT.
    if (headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetcher(input, { ...init, headers });
  };
}

export function authReturnUrl(location) {
  return location.origin + location.pathname;
}

export function authCallback(hash) {
  const values = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    setup: ['invite', 'magiclink', 'recovery'].includes(values.get('type')) || hash === '#/activate',
    error: values.has('error') ? '验证链接已过期或无法使用，请重新获取验证或重设密码邮件。' : '',
    received: values.has('access_token') || values.has('error')
  };
}
