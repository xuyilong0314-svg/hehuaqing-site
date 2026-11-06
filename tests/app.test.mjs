import test from 'node:test';
import assert from 'node:assert/strict';
import {appFixture,session,tick} from './helpers.mjs';

test('account signup requests confirmation; no false success',async t=>{
 const f=await appFixture('account/app.js');t.after(()=>f.close());await f.click('[data-mode="signup"]');
 await f.submit('#account-form',{email:'regression@example.invalid',password:'synthetic-password',confirm:'synthetic-password',display_name:'模拟账号'});
 assert.match(f.document.body.textContent,/请查收邮箱/);assert.ok(!f.document.querySelector('.verification-success'));
 assert.equal(f.calls.find(c=>c[0]==='signUp')[1].options.emailRedirectTo,'https://test.invalid/zhongyi/aform/');
});
test('account failed login preserves input and retry button',async t=>{
 const f=await appFixture('account/app.js',{authOverrides:{signInWithPassword:async()=>({error:{code:'invalid_credentials'}})}});t.after(()=>f.close());
 await f.submit('#account-form',{email:'regression@example.invalid',password:'synthetic-password'});
 assert.match(f.document.body.textContent,/邮箱或密码不正确/);assert.equal(f.document.querySelector('[name=email]').value,'regression@example.invalid');assert.equal(f.document.querySelector('[type=submit]').disabled,false);
});
test('unrelated storage events must not erase login input',async t=>{
 const f=await appFixture('account/app.js');t.after(()=>f.close());const input=f.document.querySelector('[name=email]');input.value='regression@example.invalid';
 f.dispatchEvent({type:'storage',key:'hhq-analytics-preference'});await tick();assert.equal(f.document.querySelector('[name=email]').value,input.value);
});
test('successful registration result is invalidated on another tab signout',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#/registration-result',initial:session});t.after(()=>f.close());assert.ok(f.document.querySelector('.verification-success'));
 await f.emit('SIGNED_OUT',null);assert.equal(Boolean(f.document.querySelector('.verification-success')),false);assert.ok(f.document.querySelector('#auth-form'));
});
test('recovery callback without token cannot use an old logged-in account',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#type=recovery',initial:session});t.after(()=>f.close());assert.doesNotMatch(f.document.body.textContent,/保存密码并进入档案/);
});
test('expired recovery explains password recovery rather than signup',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#type=recovery&error=access_denied&error_code=otp_expired'});t.after(()=>f.close());assert.match(f.document.querySelector('#app').textContent,/忘记密码|重设密码/);
});
test('signed in from another tab updates explicit login route',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#/login'});t.after(()=>f.close());assert.ok(f.document.querySelector('#auth-form'));
 await f.emit('SIGNED_IN',session);assert.equal(Boolean(f.document.querySelector('#auth-form')),false);assert.match(f.document.body.textContent,/模拟读者/);
});
test('in-flight reader response must not restore signed-out context',async t=>{
 let resolve;const f=await appFixture('account/client.js',{initial:session,rpcOverride:()=>new Promise(r=>{resolve=r;})});t.after(()=>f.close());let last;
 f.module.namespace.onAccount(c=>last=c);const pending=f.module.namespace.refreshAccount();await tick();await f.emit('SIGNED_OUT',null);resolve({data:{display_name:'stale'},error:null});await pending;
 assert.equal(last,null);
});
test('account login displays reading account and clears it on signout',async t=>{
 const f=await appFixture('account/app.js');t.after(()=>f.close());
 await f.submit('#account-form',{email:'regression@example.invalid',password:'synthetic-password'});
 assert.ok(f.document.querySelector('#reader-settings'));await f.emit('SIGNED_OUT',null);assert.equal(Boolean(f.document.querySelector('#reader-settings')),false);assert.ok(f.document.querySelector('#account-form'));
});
test('A-form first/returning login loads own profile',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#/auth'});t.after(()=>f.close());
 await f.submit('#auth-form',{email:'regression@example.invalid',password:'synthetic-password'});
 assert.equal(Boolean(f.document.querySelector('#auth-form')),false);assert.match(f.document.body.textContent,/模拟读者/);
});
test('A-form signup with confirmation required does not access health records',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#/auth'});t.after(()=>f.close());await f.click('[data-auth="signup"]');
 await f.submit('#auth-form',{email:'regression@example.invalid',password:'synthetic-password',confirm_password:'synthetic-password',display_name:'模拟账号'});
 assert.match(f.document.body.textContent,/查收邮箱/);assert.equal(f.calls.some(c=>c[0]==='from'),false);
});
test('forgot password sends canonical recovery request with neutral response',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#/forgot'});t.after(()=>f.close());await f.submit('#auth-form',{email:'regression@example.invalid'});
 assert.match(f.document.body.textContent,/若邮箱已注册/);assert.equal(f.calls.find(c=>c[0]==='recover')[2].redirectTo,'https://test.invalid/zhongyi/aform/');
});
test('valid recovery verifies the link then allows password update',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#type=recovery&access_token=synthetic-token-a',initial:session});t.after(()=>f.close());
 assert.match(f.document.body.textContent,/保存密码并进入档案/);assert.ok(!f.location.hash.includes('access_token'));
 await f.submit('#auth-form',{email:'regression@example.invalid',password:'synthetic-new-password',confirm_password:'synthetic-new-password'});
 assert.ok(f.calls.find(c=>c[0]==='updateUser'));assert.equal(Boolean(f.document.querySelector('#auth-form')),false);
});
test('callback retry must keep verifying the original token',async t=>{
 let attempts=0;const tokens=[];
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#type=signup&access_token=synthetic-original',initial:session,authOverrides:{getUser:async token=>{tokens.push(token);return ++attempts===1?{error:{status:503}}:{error:{status:401}};}}});t.after(()=>f.close());
 await f.click('[data-action="verification-retry"]');assert.deepEqual(tokens,['synthetic-original','synthetic-original']);assert.equal(Boolean(f.document.querySelector('.verification-success')),false);
});
for(const entry of ['account/app.js','zhongyi/aform/app.js'])for(const code of ['user_already_exists','email_not_confirmed'])test(entry+' handles '+code,async t=>{
 const f=await appFixture(entry,{hash:'#/auth',authOverrides:{signInWithPassword:async()=>({error:{name:'AuthApiError',code}})}});t.after(()=>f.close());
 await f.submit(entry.startsWith('account')?'#account-form':'#auth-form',{email:'regression@example.invalid',password:'synthetic-password'});
 assert.match(f.document.body.textContent,code==='user_already_exists'?/已.*注册/:/验证邮件/);
});
test('WeChat network error preserves account form and offers browser fallback',async t=>{
 const f=await appFixture('account/app.js',{ua:'iPhone MicroMessenger/8.0',authOverrides:{signInWithPassword:async()=>({error:{name:'AuthRetryableFetchError'}})}});t.after(()=>f.close());
 await f.submit('#account-form',{email:'regression@example.invalid',password:'synthetic-password'});
 assert.match(f.document.body.textContent,/微信右上角/);assert.ok(f.document.querySelector('[data-action="check-connection"]'));assert.equal(f.document.querySelector('[name=email]').value,'regression@example.invalid');
});
for(const entry of ['account/app.js','zhongyi/aform/app.js'])for(const duplicateError of [true,false])test(entry+' duplicate signup '+(duplicateError?'error':'obfuscated response'),async t=>{
 const f=await appFixture(entry,{hash:'#/auth',authOverrides:{signUp:async()=>duplicateError?{error:{name:'AuthApiError',code:'user_already_exists'}}:{data:{user:{id:'obfuscated',identities:[]},session:null},error:null}}});t.after(()=>f.close());
 await f.click(entry.startsWith('account')?'[data-mode="signup"]':'[data-auth="signup"]');
 await f.submit(entry.startsWith('account')?'#account-form':'#auth-form',{email:'regression@example.invalid',password:'synthetic-password',confirm:'synthetic-password',confirm_password:'synthetic-password',display_name:'模拟账号'});
 assert.equal(Boolean(f.document.querySelector('.verification-success')),false);assert.match(f.document.body.textContent,duplicateError?/已.*注册/:/已.*账号|曾经注册/);
});
test('switching users clears a previous registration-success view',async t=>{
 const f=await appFixture('zhongyi/aform/app.js',{hash:'#/registration-result',initial:session});t.after(()=>f.close());
 await f.emit('SIGNED_IN',{...session,user:{...session.user,id:'test-user-b'}});assert.equal(Boolean(f.document.querySelector('.verification-success')),false);
});
test('team recognizes shared login and clears context on signout',async t=>{
 const f=await appFixture('team/team.js');t.after(()=>f.close());assert.equal(f.calls.filter(c=>c[0]==='rpc').length,0);
 await f.emit('SIGNED_IN',session);assert.ok(f.calls.some(c=>c[1]==='team_context'));
 await f.emit('SIGNED_OUT',null);assert.match(f.document.querySelector('#app').textContent,/登录/);
});
test('late reading history cannot replace the signed-out screen',async t=>{
 let resolve;const f=await appFixture('account/app.js',{initial:session,rpcOverride:name=>name==='site_my_reading'?new Promise(r=>{resolve=r;}):{data:{display_name:'模拟读者',is_admin:false},error:null}});t.after(()=>f.close());
 await f.emit('SIGNED_OUT',null);resolve({data:[{title:'旧会话记录',last_read:'2026-11-06'}],error:null});await tick();
 assert.ok(f.document.querySelector('#account-form'));assert.doesNotMatch(f.document.body.textContent,/旧会话记录/);
});
