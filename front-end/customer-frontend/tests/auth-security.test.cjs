const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/auth.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function config(fetch) {
  let result;
  const auth = options => { result = options; return {}; };
  const dependencies = name => {
    if (name === 'next-auth') return { default: auth, CredentialsSignin: class extends Error {} };
    if (name === '@/lib/authProfile') return { enrichCustomerSession: async t => t };
    if (name === '@/lib/authClient') return { authClientHeaders: async () => ({ 'X-Auth-Client': 'test' }) };
    return { default: options => options };
  };
  new Function('exports', 'require', 'fetch', 'process', compiled)({}, dependencies, fetch, { env: { AUTH_SECRET: 'server-only-secret' } });
  return result;
}
test('Facebook uses access token, and session identity comes from Authentication', async () => {
  const auth = config(async (url, options) => {
    assert.match(url,/facebook$/); assert.deepEqual(JSON.parse(options.body),{access_token:'facebook-access'});
    return Response.json({user_id:'application-user',access_token:'access',refresh_token:'refresh',expires_in:900000});
  });
  const user={id:'facebook-id'};
  assert.equal(await auth.callbacks.signIn({user,account:{provider:'facebook',access_token:'facebook-access'}}),true);
  const token=await auth.callbacks.jwt({token:{},user});assert.equal(token.sub,'application-user');assert.equal(token.accessToken,'access');
  assert.equal(auth.secret,'server-only-secret');
});
test('rejected OAuth never proceeds to issue a session',async()=>{
  const auth=config(async()=>new Response('conflict',{status:409}));
  const user={id:'google-id'};
  assert.equal(await auth.callbacks.signIn({user,account:{provider:'google',id_token:'google-token'}}),'/login?error=OAuthSignInFailed');
  assert.equal(user.accessToken,undefined);
});
test('operational login failures are distinguishable from wrong credentials',async()=>{
  for(const [status,code] of [[503,'service_unavailable'],[429,'rate_limited'],[403,'staff_only']]) {
    const auth=config(async()=>new Response('',{status}));
    await assert.rejects(auth.providers[2].authorize({email:'a@example.com',password:'test'}),e=>e.code===code);
  }
  const auth=config(async()=>new Response('',{status:401}));
  assert.equal(await auth.providers[2].authorize({email:'a@example.com',password:'test'}),null);
});
test('logout revokes only the current backend refresh token',async()=>{
  let calls=0;
  const auth=config(async(url,options)=>{calls++;assert.match(url,/auth\/logout$/);assert.deepEqual(JSON.parse(options.body),{request:'this-session'});return Response.json({});});
  await auth.events.signOut({token:{refreshToken:'this-session'}});assert.equal(calls,1);
});
test('refresh failure removes the stale access token',async()=>{
  const auth=config(async()=>{throw Error('offline');});
  const token=await auth.callbacks.jwt({token:{accessToken:'stale',refreshToken:'refresh',accessTokenExpires:0}});
  assert.equal(token.accessToken,undefined);assert.equal(token.error,'RefreshTokenExpired');
});
