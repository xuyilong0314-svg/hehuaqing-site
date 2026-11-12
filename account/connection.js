// Transport only: keep the existing project URL, session storage key and callback URLs.
export const ACCOUNT_GATEWAY_ORIGIN = 'https://account-api.hehuaqing.com';
const PROJECT_ORIGIN = 'https://mdwbtgjyrdqfwupvadir.supabase.co';
const connections = new WeakMap();

function projectAccountUrl(input) {
  const url = new URL(input instanceof Request ? input.url : String(input));
  return url.origin === PROJECT_ORIGIN && /^\/(auth|rest)\/v1\//.test(url.pathname) ? url : null;
}

export function accountConnectionInput(input, origin = ACCOUNT_GATEWAY_ORIGIN) {
  const request = input instanceof Request;
  const url = projectAccountUrl(input);
  if (!url || origin === PROJECT_ORIGIN) return input;
  const target = ACCOUNT_GATEWAY_ORIGIN + url.pathname + url.search;
  return request ? new Request(target, input) : target;
}

// Probe public settings only. A signup, login or profile write is sent once,
// after an available connection is selected; it is never replayed on failure.
export function chooseAccountOrigin(key, fetcher = fetch, timeoutMs = 12000) {
  const origins = [PROJECT_ORIGIN, ACCOUNT_GATEWAY_ORIGIN];
  return new Promise((resolve, reject) => {
    const controllers = origins.map(() => new AbortController());
    let finished = false, failures = 0;
    const finish = (origin) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      controllers.forEach(controller => controller.abort());
      if (origin) resolve(origin);
      else reject(new TypeError('账号连接未成功，请稍后重试。'));
    };
    const timer = setTimeout(() => finish(), timeoutMs);
    origins.forEach(async (origin, index) => {
      try {
        const response = await fetcher(origin + '/auth/v1/settings', {
          method: 'GET', headers: {apikey: key, Accept: 'application/json'},
          credentials: 'omit', cache: 'no-store', signal: controllers[index].signal
        });
        if (!response.ok) throw Error('connection_unavailable');
        const settings = await response.json();
        if (typeof settings.disable_signup !== 'boolean' || settings.external?.email !== true) throw Error('invalid_account_service');
        finish(origin);
      } catch {
        failures++;
        if (failures === origins.length) finish();
      }
    });
  });
}

export function resetAccountConnection(key, fetcher = fetch) {
  connections.get(fetcher)?.delete(key);
}

export async function connectedAccountInput(input, key, fetcher = fetch) {
  // Unrelated URLs and storage requests retain their existing transport.
  if (!projectAccountUrl(input)) return input;
  let selected = connections.get(fetcher);
  if (!selected) { selected = new Map(); connections.set(fetcher, selected); }
  if (!selected.has(key)) {
    const pending = chooseAccountOrigin(key, fetcher).catch(error => {
      if (selected.get(key) === pending) selected.delete(key);
      throw error;
    });
    selected.set(key, pending);
  }
  return accountConnectionInput(input, await selected.get(key));
}
