import {ANALYTICS_URL,ANALYTICS_KEY} from '../analytics/config.js?v=20261031-20';
import {publicApiFetch} from '../zhongyi/aform/auth.js?v=20261112-flow-1';

export function accountChanged() {
  const error = new Error('账号已切换，请在当前账号重新填写并保存。');
  error.code = 'account_changed';
  return error;
}

// Bind a form write to its displayed account. A later session switch must never
// redirect an old form's values into the newly signed-in account.
export async function accountRequest(db, expectedUserId, path, {method='POST', body, signal, fetcher=fetch} = {}) {
  if (!expectedUserId) throw accountChanged();
  const {data,error} = await db.auth.getSession();
  if (error) throw error;
  const session = data.session;
  if (!session?.access_token || session.user?.id !== expectedUserId) throw accountChanged();
  const response = await publicApiFetch(ANALYTICS_KEY,fetcher)(ANALYTICS_URL + path, {
    method, signal,
    headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json','X-Supabase-Api-Version':'2024-01-01'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const failure = new Error(payload?.msg || payload?.message || '账号服务暂未完成请求。');
    failure.code = payload?.code || payload?.error_code;
    failure.status = response.status;
    throw failure;
  }
  return payload;
}
