import test from 'node:test';
import assert from 'node:assert/strict';
import {authCallback,authReturnUrl,publicApiFetch} from '../zhongyi/aform/auth.js';
import {registrationOutcome} from '../zhongyi/aform/registration.js';
import {authIssue,checkAuthConnection,isWeChat} from '../account/auth-support.js';
import {person,session} from './helpers.mjs';

const auth=(s=session,u=person)=>({getSession:async()=>({data:{session:s}}),getUser:async()=>({data:{user:u}})});
test('canonical email return URL strips query and tokens',()=>{
 for(const host of ['www.hehuaqing.com','hehuaqing.com','xuyilong0314-svg.github.io'])assert.equal(authReturnUrl(new URL(`https://${host}/anything/?secret=x#token`)),'https://www.hehuaqing.com/zhongyi/aform/');
 assert.equal(authReturnUrl(new URL('http://localhost:8000/zhongyi/aform/?a=b#x')),'http://localhost:8000/zhongyi/aform/');
});
for(const [name,a,cb,state] of [
 ['confirmed session',auth(),{},'success'],['no session',auth(null),{},'missing'],['wrong identity',auth(session,{...person,id:'other'}),{},'missing'],['unconfirmed email',auth(session,{...person,email_confirmed_at:null}),{},'unconfirmed'],['explicit expired link',auth(),{error:'otp_expired'},'expired'],['signup flag alone',auth(),{signup:true,hasAccessToken:false},'missing'],['recovery flag alone',auth(),{setup:true,hasAccessToken:false},'missing'],
 ['invalid callback cannot borrow old session',{...auth(),getUser:async token=>token==='bad-callback'?{error:{status:401}}:{data:{user:person}}},{signup:true,hasAccessToken:true,accessToken:'bad-callback'},'expired'],
 ['server 503',{...auth(),getUser:async()=>({error:{status:503}})},{},'retry'],['revoked session',{...auth(),getUser:async()=>({error:{status:401}})},{},'expired'],['offline',{...auth(),getUser:async()=>{throw new TypeError('Failed to fetch');}},{},'retry'],['verification timeout',{...auth(),getSession:()=>new Promise(()=>{})},{},'retry']
])test('registration: '+name,async()=>assert.equal((await registrationOutcome(a,cb,8)).state,state));
test('callback also recognizes query errors',()=>assert.ok(authCallback('', '?error=access_denied&error_code=otp_expired').error));
test('callback retains recovery intent and token in memory',()=>{const c=authCallback('#type=recovery&access_token=synthetic');assert.equal(c.setup,true);assert.equal(c.accessToken,'synthetic');});
for(const [error,reference]of [
 [{code:'invalid_credentials'},'AUTH-CREDENTIALS'],[{code:'email_not_confirmed'},'AUTH-EMAIL-STATE'],[{code:'user_already_exists'},'AUTH-EXISTS'],[{code:'weak_password'},'AUTH-PASSWORD'],[{status:429},'AUTH-RATE-LIMIT'],[{status:503},'AUTH-SERVICE'],[{name:'AuthRetryableFetchError'},'AUTH-CONNECTION'],[{name:'AbortError'},'AUTH-CONNECTION'],[{code:'signup_disabled'},'AUTH-SIGNUP-DISABLED'],[{code:'email_address_not_authorized'},'AUTH-MAIL-SERVICE']
])test('error category '+reference,()=>assert.equal(authIssue(error).reference,reference));
test('WeChat detection does not affect normal browsers',()=>{assert.equal(isWeChat('iPhone MicroMessenger/8'),true);assert.equal(isWeChat('Chrome'),false);});
test('anonymous connection check confirms verification requirement',async()=>{
 const r=await checkAuthConnection({url:'https://test.invalid',key:'sb_publishable_test'},async(url,init)=>{assert.equal(init.credentials,'omit');assert.equal(init.headers.Authorization,undefined);return {ok:true,json:async()=>({external:{email:true},disable_signup:false,mailer_autoconfirm:false})};});
 assert.equal(r.ok,true);assert.match(r.text,/验证/);
});
test('connection diagnostic aborts a hanging request',async()=>{
 const r=await checkAuthConnection({url:'https://test.invalid',key:'test'},(_u,i)=>new Promise((_r,reject)=>i.signal.addEventListener('abort',()=>reject(Error('aborted')))),5);assert.equal(r.reference,'CHECK-TIMEOUT');
});
test('publishable key is never sent as user bearer token',async()=>{
 const f=publicApiFetch('sb_publishable_test',async(_u,i)=>i.headers);
 assert.equal((await f('https://test.invalid/auth/v1/token',{headers:{Authorization:'Bearer sb_publishable_test'}})).get('Authorization'),null);
 assert.equal((await f('https://test.invalid/auth/v1/user',{headers:{Authorization:'Bearer synthetic-user'}})).get('Authorization'),'Bearer synthetic-user');
});
test('auth transport aborts hanging requests and preserves caller cancellation',async()=>{
 const fetcher=(_u,i)=>new Promise((_r,reject)=>{if(i.signal.aborted)reject(new DOMException('aborted','AbortError'));else i.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')));});
 await assert.rejects(publicApiFetch('sb_publishable_test',fetcher,5)('https://test.invalid/auth/v1/token'),{name:'AbortError'});
 const controller=new AbortController();controller.abort();
 await assert.rejects(publicApiFetch('sb_publishable_test',fetcher)('https://test.invalid/auth/v1/user',{signal:controller.signal}),{name:'AbortError'});
});
