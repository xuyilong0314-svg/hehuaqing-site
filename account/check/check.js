(function () {
  'use strict';
  var key = 'sb_publishable_Bv3ZwWdB9hiPxuN47w_fyg_HQgDLemO';
  var routes = [
    {id:'primary', name:'账号主线路', origin:'https://mdwbtgjyrdqfwupvadir.supabase.co'},
    {id:'gateway', name:'账号备用线路', origin:'https://account-api.hehuaqing.com'}
  ];
  var retry = document.getElementById('retry');
  var report = document.getElementById('report');
  var running = false;
  function show(id, text, ok) {
    var el = document.getElementById(id);
    el.textContent = text;
    el.className = 'status' + (ok === true ? ' ok' : ok === false ? ' fail' : '');
  }
  // Classic script and XMLHttpRequest keep the checker usable even if the
  // account application's newer JavaScript or fetch API is unavailable.
  function request(origin, authenticatedHeaders, done) {
    var xhr = new XMLHttpRequest(), settled = false;
    var timer = setTimeout(function () { finish('timeout', 0); xhr.abort(); }, 12000);
    function finish(kind, status) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done({kind:kind, status:status});
    }
    try {
      xhr.open('GET', origin + (authenticatedHeaders ? '/auth/v1/user' : '/auth/v1/settings'), true);
      xhr.withCredentials = false;
      xhr.timeout = 12000;
      xhr.setRequestHeader('apikey', key);
      xhr.setRequestHeader('Accept', 'application/json');
      if (authenticatedHeaders) {
        // A deliberately invalid, non-user token tests the same CORS headers
        // as account calls. The expected denial reads no personal information.
        xhr.setRequestHeader('Authorization', 'Bearer connection-check-not-a-user-token');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Client-Info', 'hhq-connection-check/1');
        xhr.setRequestHeader('X-Supabase-Api-Version', '2024-01-01');
      }
      xhr.onload = function () {
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (ignore) { finish('unexpected', xhr.status); return; }
        var valid = authenticatedHeaders
          ? (xhr.status === 401 || xhr.status === 403) && !!(data.code || data.error_code || data.msg || data.message)
          : xhr.status === 200 && typeof data.disable_signup === 'boolean' && data.external && data.external.email === true;
        finish(valid ? 'ok' : 'unexpected', xhr.status);
      };
      xhr.onerror = function () { finish('network', 0); };
      xhr.ontimeout = function () { finish('timeout', 0); };
      xhr.onabort = function () { finish('aborted', 0); };
      xhr.send();
    } catch (error) { finish('unsupported', 0); }
  }
  function fetchRequest(origin, authenticatedHeaders, done) {
    if (!window.fetch || !window.AbortController) { done({kind:'unsupported',status:0}); return; }
    var controller = new AbortController(), settled = false;
    var timer = setTimeout(function () { finish('timeout', 0); controller.abort(); }, 12000);
    function finish(kind, status) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done({kind:kind,status:status});
    }
    var headers = {apikey:key, Accept:'application/json'};
    if (authenticatedHeaders) {
      headers.Authorization = 'Bearer connection-check-not-a-user-token';
      headers['Content-Type'] = 'application/json';
      headers['X-Client-Info'] = 'hhq-connection-check/1';
      headers['X-Supabase-Api-Version'] = '2024-01-01';
    }
    try {
      window.fetch(origin + (authenticatedHeaders ? '/auth/v1/user' : '/auth/v1/settings'), {
        method:'GET', headers:headers, credentials:'omit', cache:'no-store', signal:controller.signal
      }).then(function (response) {
        return response.json().then(function (data) {
          var valid = authenticatedHeaders
            ? (response.status === 401 || response.status === 403) && !!(data.code || data.error_code || data.msg || data.message)
            : response.status === 200 && typeof data.disable_signup === 'boolean' && data.external && data.external.email === true;
          finish(valid ? 'ok' : 'unexpected', response.status);
        }, function () { finish('unexpected', response.status); });
      }).catch(function () { finish('network', 0); });
    } catch (error) { finish('unsupported', 0); }
  }
  function run() {
    if (running) return;
    running = true;
    document.getElementById('connection-loading').hidden = false;
    retry.disabled = true;
    retry.textContent = '正在检查…';
    document.getElementById('summary').textContent = '正在检查，请稍候…';
    var supported = !!(window.fetch && window.Promise && window.AbortController && window.URL && window.Headers && window.Request && window.Response && window.WeakMap);
    var modern = false;
    try { modern = Function('return ({value:1})?.value ?? 0')() === 1; } catch (ignore) {}
    var browserOK = supported && modern;
    show('browser', browserOK ? '基本功能可用' : '部分功能不支持，请更新浏览器后再试', browserOK);
    var results = [], remaining = routes.length * 2, successes = 0, compatibilitySuccesses = 0;
    function complete(route, transport, settings, api) {
      var ok = settings.kind === 'ok' && api.kind === 'ok';
      if (ok && transport === 'fetch') successes++;
      if (ok && transport === 'xhr') compatibilitySuccesses++;
      var message = ok ? '连接成功' : settings.kind === 'ok' ? '配置可读取，但账号请求未连通' : '暂时无法连接';
      if (settings.kind === 'timeout' || api.kind === 'timeout') message += '（等待超时）';
      var label = transport === 'fetch' ? '网页请求' : '兼容请求';
      show(route.id + '-' + transport, label + '：' + message, ok);
      results.push(route.name + '/' + label + '：' + message + '；配置=' + settings.kind + '/' + settings.status + '；账号接口=' + api.kind + '/' + api.status);
      remaining--;
      if (remaining) return;
      document.getElementById('summary').textContent = !browserOK ? '请先更新浏览器，再重新检查。' : successes ? '有可用的账号连接，可以返回登录。' : compatibilitySuccesses ? '兼容请求可连接，但网页请求失败。请把此页结果告知网站管理员。' : '当前浏览器未连通账号服务，请把此页结果告知网站管理员。';
      report.value = ['连接检查 20261116-1', new Date().toISOString(), '浏览器基本功能：' + (browserOK ? '通过' : '未通过'), '当前页面：' + location.origin + location.pathname, '浏览器标识：' + navigator.userAgent].concat(results).join('\n');
      running = false;
      document.getElementById('connection-loading').hidden = true;
      retry.disabled = false;
      retry.textContent = '重新检查';
    }
    for (var i = 0; i < routes.length; i++) (function (route) {
      ['fetch','xhr'].forEach(function (transport) {
        show(route.id + '-' + transport, '正在检查…');
        var send = transport === 'fetch' ? fetchRequest : request;
        send(route.origin, false, function (settings) {
          if (settings.kind !== 'ok') { complete(route, transport, settings, {kind:'skipped',status:0}); return; }
          send(route.origin, true, function (api) { complete(route, transport, settings, api); });
        });
      });
    })(routes[i]);
  }
  retry.onclick = run;
  run();
})();
