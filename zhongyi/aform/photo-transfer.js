// These are two addresses for the same private Supabase project.
export const PHOTO_ORIGINS = [
  'https://mdwbtgjyrdqfwupvadir.storage.supabase.co',
  'https://mdwbtgjyrdqfwupvadir.supabase.co'
];
const bucket = 'case-photos';
const uuid = '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}';
const pathPattern = new RegExp('^' + uuid + '/' + uuid + '\\.jpg$');
const networkMessage = /Load failed|Failed to fetch|NetworkError|network request|connection.*failed/i;
const transientCodes = new Set(['photo_network', 'photo_timeout', 'photo_service', 'photo_unconfirmed']);
const retryLimitMs = 10000;

export const photoFailure = (code, status = 0) => Object.assign(new Error(code), {code, status});
function checkSignal(signal) {
  if (signal?.aborted) throw new DOMException('上传已停止', 'AbortError');
}
function canRetry(error) {
  return transientCodes.has(error?.code) || networkMessage.test(error?.message || '');
}
function waitForRetry(ms, signal) {
  checkSignal(signal);
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      reject(new DOMException('上传已停止', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', stop);
      resolve();
    }, ms);
    signal?.addEventListener('abort', stop, {once:true});
  });
}

export function photoUploadMessage(error, item) {
  const {code, name} = error || {};
  const status = Number(error?.status || error?.statusCode) || 0;
  const message = String(error?.message || '');
  if (name === 'AbortError' || code === 'photo_account_changed') return '账号或页面已变化，上传已停止。请确认登录账号后重新打开档案。';
  if (status === 401 || code === 'photo_login_required') return '登录状态需要重新确认。请先保留本页填写内容，再重新登录。';
  if (status === 403 || /row.level|permission|Unauthorized/i.test(message)) return '当前账号没有保存这张照片的权限，请确认是自己的客户档案且已取得照片保存授权。';
  if (status === 413 || code === 'photo_too_large') return '这张照片较大，请选择较小的照片后重试。';
  if (code === 'photo_mismatch') return '云端照片与本次文件不一致。请移出这张待传照片，再重新选择。';
  if (code === 'photo_rate_limited' || status === 429) return '照片服务正在限制请求频率。请保留本页，稍后再点「重试未成功照片」。';
  if (item?.failedPhase === 'preparing') return '手机未能处理这张照片。请移出这张照片，再从相册选取可打开的 JPG、PNG 或 WebP。';
  if (item?.failedPhase === 'confirming' && canRetry(error)) return '照片已传到存储，档案还没确认保存。请保留本页，重试会接着确认。';
  if (code === 'photo_timeout') return '照片传输超时，尚未确认保存。请保留本页，连接恢复后重试。';
  if (code === 'photo_service' || status >= 500) return '照片服务暂时异常。照片仍保留在本页，请稍后重试。';
  if (code === 'photo_network' || networkMessage.test(message)) return '照片连接中断，尚未确认保存。请保留本页，切换 Wi-Fi 或移动数据后重试。';
  if (code === 'photo_unconfirmed') return '照片可能已送达。请保留本页，重试时会核对同一张照片。';
  return '照片尚未保存。请保留本页重试。若仍失败，请复制排查信息。';
}

function retryAfterMs(value) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  return Math.max(0, Date.parse(value) - Date.now()) || 0;
}

export function xhrPhotoRequest(url, {method = 'GET', headers = {}, body, signal, onProgress, timeout = 45000, binary = false} = {}, factory = () => new XMLHttpRequest()) {
  return new Promise((resolve, reject) => {
    checkSignal(signal);
    const xhr = factory();
    let settled = false;
    const finish = (error, response) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      xhr.onload = xhr.onerror = xhr.ontimeout = xhr.onabort = null;
      if (xhr.upload) xhr.upload.onprogress = null;
      if (error) reject(error);
      else resolve(response);
    };
    const abort = () => {
      xhr.abort();
      finish(new DOMException('上传已停止', 'AbortError'));
    };
    xhr.open(method, url, true);
    xhr.timeout = timeout;
    xhr.withCredentials = false;
    xhr.responseType = binary ? 'arraybuffer' : 'text';
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = event => {
        if (event.lengthComputable && !settled) onProgress(event.loaded, event.total);
      };
    }
    xhr.onload = () => {
      if (!xhr.status) {
        finish(photoFailure('photo_network'));
        return;
      }
      let data = xhr.response;
      if (!binary || xhr.status >= 400) {
        try {
          data = JSON.parse(binary ? new TextDecoder().decode(data) : xhr.responseText);
        } catch {
          data = null;
        }
      }
      const response = {status:xhr.status, data};
      const retryHeader = (xhr.getAllResponseHeaders?.() || '').match(/^retry-after:\s*([^\r\n]+)/im)?.[1];
      if (retryHeader) response.retryAfterMs = retryAfterMs(retryHeader.trim());
      finish(null, response);
    };
    xhr.onerror = () => finish(photoFailure('photo_network'));
    xhr.ontimeout = () => { xhr.abort(); finish(photoFailure('photo_timeout')); };
    xhr.onabort = () => finish(signal?.aborted ? new DOMException('上传已停止', 'AbortError') : photoFailure('photo_timeout'));
    signal?.addEventListener('abort', abort, {once:true});
    if (signal?.aborted) {
      abort();
      return;
    }
    try {
      xhr.send(body ?? null);
    } catch {
      finish(photoFailure('photo_network'));
    }
  });
}

const accepted = response => response.status >= 200 && response.status < 300;
function duplicate(response) {
  return response.status === 409 ||
    ['Duplicate', 'ResourceAlreadyExists', 'KeyAlreadyExists', 'already_exists'].includes(response.data?.code) ||
    /already exists/i.test(response.data?.message || '');
}
function missingObject(response) {
  return ['NoSuchKey', 'not_found', 'ObjectNotFound'].includes(response.data?.code) ||
    (response.status === 404 && !response.data?.code) ||
    (response.status === 400 && /^(object|key) not found$/i.test(response.data?.message || ''));
}
function statusError(response) {
  const legacyStatus = Number(response.data?.statusCode || response.data?.httpStatusCode);
  const status = response.status === 400 && legacyStatus >= 400 && legacyStatus <= 599 ? legacyStatus : response.status;
  const rateLimited = status === 429 || ['SlowDown', 'RateLimitExceeded', 'TooManyRequests'].includes(response.data?.code);
  let code = 'photo_rejected';
  if (rateLimited) code = 'photo_rate_limited';
  else if (status === 408) code = 'photo_timeout';
  else if (status >= 500 && status !== 507) code = 'photo_service';
  const error = photoFailure(code, status);
  error.httpStatus = response.status;
  error.retryAfterMs = response.retryAfterMs || 0;
  return error;
}
function rememberFailure(item, operation, error) {
  item.transferErrors = [
    ...(item.transferErrors || []).slice(-5),
    {operation, connection:item.connection, code:error.code || 'photo_unknown', http:error.httpStatus || error.status || 0}
  ];
}

// POST's create-only path is stable for every retry. A transient read failure
// can leave the object status unknown; it cannot turn the next POST into an overwrite.
export async function transferPhoto({
  db, key, item, expectedUserId, signal, phase = () => {}, progress = () => {},
  request = xhrPhotoRequest, wait = waitForRetry
}) {
  if (!pathPattern.test(item.path) || !key?.startsWith('sb_publishable_') || !item.blob?.size) throw photoFailure('photo_invalid_input');
  if (item.blob.size > 10 * 1024 * 1024) throw photoFailure('photo_too_large');
  checkSignal(signal);
  phase('connecting');
  if (item.retryAt > Date.now()) throw photoFailure('photo_rate_limited');
  const result = await db.auth.getSession();
  checkSignal(signal);
  if (result.error) throw result.error;
  const session = result.data?.session;
  if (!session?.access_token) throw photoFailure('photo_login_required');
  if (!expectedUserId || session.user?.id !== expectedUserId) throw photoFailure('photo_account_changed');

  const headers = {apikey:key, Authorization:'Bearer ' + session.access_token};
  const objectPath = '/storage/v1/object/' + bucket + '/' + item.path;
  const verify = async origin => {
    phase('checking');
    const response = await request(origin + '/storage/v1/object/authenticated/' + bucket + '/' + item.path, {
      headers, signal, binary:true, timeout:12000
    });
    checkSignal(signal);
    if (missingObject(response)) return false;
    if (!accepted(response)) throw statusError(response);
    const received = new Uint8Array(response.data);
    const expected = new Uint8Array(await item.blob.arrayBuffer());
    checkSignal(signal);
    if (received.length !== expected.length || received.some((byte, index) => byte !== expected[index])) {
      throw photoFailure('photo_mismatch');
    }
    return true;
  };

  const started = Date.now();
  let originIndex = 0;
  let rateRetried = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    checkSignal(signal);
    const origin = PHOTO_ORIGINS[originIndex];
    item.connection = originIndex ? 'alternate' : 'direct';
    let operation = 'read';
    try {
      if (item.uploadAttempted) {
        try {
          if (await verify(origin)) return;
        } catch (error) {
          if (!canRetry(error)) throw error;
          rememberFailure(item, 'read', error);
        }
      }
      operation = 'write';
      item.progress = null;
      item.uploadAttempted = true;
      phase(originIndex ? 'reconnecting' : 'uploading');
      const response = await request(origin + objectPath, {
        method:'POST', headers:{...headers, 'Content-Type':'image/jpeg', 'x-upsert':'false'},
        body:item.blob, signal, timeout:45000,
        onProgress:(loaded, total) => {
          const percent = Math.min(100, Math.floor(loaded / total * 100));
          if (percent !== item.progress) {
            item.progress = percent;
            progress();
          }
        }
      });
      checkSignal(signal);
      if (accepted(response) && response.data?.Key === bucket + '/' + item.path) return;
      if (accepted(response) || duplicate(response)) {
        operation = 'read';
        if (await verify(origin)) return;
        throw photoFailure('photo_unconfirmed');
      }
      throw statusError(response);
    } catch (error) {
      checkSignal(signal);
      rememberFailure(item, operation, error);
      const rateLimited = error.code === 'photo_rate_limited';
      if (!rateLimited && !canRetry(error)) throw error;
      const baseDelay = rateLimited ? 2400 : error.code === 'photo_service' ? 700 : 0;
      const jitter = Math.round(Math.random() * 450);
      const delay = Math.max(error.retryAfterMs || 0, (baseDelay || (attempt ? 750 : 0)) * (attempt + 1) + jitter);
      if (rateLimited) item.retryAt = Date.now() + delay;
      if (attempt === 2 || (attempt === 1 && Date.now() - started >= 55000) ||
          delay > retryLimitMs || (rateLimited && rateRetried)) throw error;
      if (rateLimited) rateRetried = true;
      else originIndex = 1 - originIndex;
      phase('retrying');
      await wait(delay, signal);
    }
  }
}

async function photoRecordRequest(query, signal) {
  checkSignal(signal);
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, 30000);
  signal?.addEventListener('abort', abort, {once:true});
  let result;
  try {
    result = await query.abortSignal(controller.signal);
  } catch (error) {
    if (!controller.signal.aborted) throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
  checkSignal(signal);
  if (controller.signal.aborted) throw photoFailure('photo_timeout');
  if (result.error && result.status === 0) throw photoFailure('photo_network');
  return result;
}

function photoRecordData(result) {
  if (!result.error) return result.data;
  const error = statusError({status:result.status || 0, data:result.error});
  if (error.code === 'photo_rejected' && /^[\w]{1,20}$/.test(result.error.code || '')) error.code = result.error.code;
  throw error;
}

export async function savePhotoRecord({db, item, signal, wait = waitForRetry}) {
  const find = async () => photoRecordData(await photoRecordRequest(
    db.from('photos').select('*').eq('id', item.id).maybeSingle(), signal
  ));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let saved = item.metadataAttempted ? await find() : null;
      if (!saved) {
        item.metadataAttempted = true;
        const result = await photoRecordRequest(
          db.from('photos').insert({...item.metadata, storage_path:item.path}).select().single(), signal
        );
        saved = result.error?.code === '23505' ? await find() : photoRecordData(result);
      }
      if (!saved) throw photoFailure('photo_unconfirmed');
      if (saved.id !== item.id || saved.storage_path !== item.path ||
          saved.case_id !== item.metadata.case_id || saved.stage !== item.metadata.stage) {
        throw photoFailure('photo_mismatch');
      }
      return saved;
    } catch (error) {
      checkSignal(signal);
      if (attempt || !canRetry(error)) throw error;
      await wait(600 + Math.round(Math.random() * 350), signal);
    }
  }
}

export function photoDiagnostic(batch) {
  const safeCode = code => /^[a-z0-9_]{1,40}$/i.test(String(code)) ? code : 'photo_unknown';
  const http = value => Number(value) >= 100 && Number(value) <= 599 ? 'HTTP ' + Number(value) : '无 HTTP 状态';
  const failures = batch.items.filter(item => item.status !== 'success').map((item, index) => {
    const history = (item.transferErrors || []).map(entry =>
      (entry.connection === 'alternate' ? '备用' : '专用') + (entry.operation === 'read' ? '核对' : '上传') +
      ' ' + safeCode(entry.code) + ' ' + http(entry.http)
    );
    const status = item.errorCode ?
      '步骤 ' + safeCode(item.failedPhase) + ' · ' + safeCode(item.errorCode) + ' · ' + http(item.errorHttp) + (item.errorAt ? ' · ' + item.errorAt : '') :
      '等待上传';
    return '照片 ' + (index + 1) + ' · ' + status + (history.length ? '\n  ' + history.join(' / ') : '');
  });
  return ['照片上传排查 · 20261121-photo-2 · 时间为 UTC', ...failures,
    '内容仅含步骤、状态、时间和入口。'].join('\n');
}
