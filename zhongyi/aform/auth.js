import {connectedAccountInput,resetAccountConnection} from '../../account/connection.js?v=20261112-stability-1';
// Only the public application key belongs in this browser bundle.
export function publicApiFetch(key, fetcher = fetch, {timeoutMs = 20000, logoutTimeoutMs = 4000} = {}) {
  if (!key?.startsWith('sb_publishable_')) throw new Error('网站连接参数无效，请联系管理员。');
  return async (input, init = {}) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    // The gateway requires the publishable key in apikey, never as a user JWT.
    if (headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    const url = new URL(input instanceof Request ? input.url : String(input));
    const accountRequest = url.origin === 'https://mdwbtgjyrdqfwupvadir.supabase.co' && /^\/(auth|rest)\/v1\//.test(url.pathname);
    if (!accountRequest) return fetcher(input, {...init, headers});
    const controller = new AbortController();
    const callerSignal = init.signal === undefined && input instanceof Request ? input.signal : init.signal;
    let timer, onAbort;
    const stopped = new Promise((_, reject) => {
      onAbort = () => { controller.abort(); reject(callerSignal?.reason || new DOMException('Aborted', 'AbortError')); };
      if (callerSignal?.aborted) onAbort();
      else callerSignal?.addEventListener('abort', onAbort, {once:true});
      timer = setTimeout(() => {
        controller.abort();
        reject(new DOMException('账号请求超时（timeout），请使用原邮箱重试。', 'TimeoutError'));
      }, url.pathname === '/auth/v1/logout' ? logoutTimeoutMs : timeoutMs);
    });
    try {
      const response = await Promise.race([stopped, (async () => {
        if (controller.signal.aborted) throw callerSignal?.reason || new DOMException('Aborted', 'AbortError');
        const connected = await connectedAccountInput(input,key,fetcher);
        if (controller.signal.aborted) throw callerSignal?.reason || new DOMException('Aborted', 'AbortError');
        const result = await fetcher(connected, {...init, headers, signal:controller.signal, ...(connected !== input ? {credentials:'omit',cache:'no-store'} : {})});
        // The deadline includes a stalled response body, not just response headers.
        const body = [204,205,304].includes(result.status) || init.method === 'HEAD' ? null : await result.arrayBuffer();
        return new Response(body, {status:result.status, statusText:result.statusText, headers:result.headers});
      })()]);
      // Re-select for the next attempt; never replay an ambiguous write.
      if (response.status >= 500) resetAccountConnection(key,fetcher);
      return response;
    } catch (error) {
      if (!callerSignal?.aborted) resetAccountConnection(key,fetcher);
      throw error;
    } finally { clearTimeout(timer); callerSignal?.removeEventListener('abort',onAbort); }
  };
}

export function authReturnUrl(location) {
  const url = new URL(location.origin + location.pathname);
  if (['www.hehuaqing.com', 'hehuaqing.com', 'xuyilong0314-svg.github.io'].includes(url.hostname)) {
    return 'https://www.hehuaqing.com/zhongyi/aform/';
  }
  return url.origin + url.pathname;
}

export function authCallback(hash) {
  const values = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    setup: ['invite', 'magiclink', 'recovery'].includes(values.get('type')) || hash === '#/activate',
    signup: values.get('type') === 'signup',
    hasAccessToken: Boolean(values.get('access_token')),
    error: values.has('error') || values.has('error_code') ? '验证链接已过期或无法使用，请重新获取验证或重设密码邮件。' : '',
    received: values.has('access_token') || values.has('error') || values.has('error_code')
  };
}
