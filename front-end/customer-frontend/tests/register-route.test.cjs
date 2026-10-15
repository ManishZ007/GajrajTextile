const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the real route without starting Next or making network requests.
const source = fs.readFileSync(path.join(__dirname, '../src/app/api/register/route.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function route(fetch) {
  const exports = {};
  new Function('exports', 'require', 'fetch', 'process', compiled)(exports,
    () => ({ internalServiceUrl: url => url }), fetch, { env: { AUTH_SERVICE_URL: 'http://authentication:8081/' } });
  return exports.POST;
}
function request(body = {}) {
  return new Request('https://shop.example/api/register', { method: 'POST', headers: { Origin: 'https://shop.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Test', email: 'test@example.com', phoneNumber: '9876543210', password: 'test-password', ...body }) });
}
test('uses configured backend and forces CUSTOMER even if client supplies OWNER', async () => {
  const post = route(async (url, options) => {
    assert.equal(url, 'http://authentication:8081/auth/register');
    const data = JSON.parse(options.body); assert.equal(data.role, 'CUSTOMER'); assert.equal(data.passwordHash, 'test-password');
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ user: 'created' }, { status: 201 });
  });
  assert.equal((await post(request({ role: 'OWNER' }))).status, 201);
});
test('preserves duplicate errors from JSON and legacy plain text', async () => {
  for (const response of [Response.json({ message: 'Phone already used' }, { status: 409 }), new Response('Email already used', { status: 409 })]) {
    const result = await route(async () => response)(request());
    assert.equal(result.status, 409); assert.match((await result.json()).message, /already used/);
  }
});
test('dependency failures return a safe error, never database details', async () => {
  const result = await route(async () => new Response('SQL credentials and stack trace', { status: 500 }))(request());
  assert.equal(result.status, 503); assert.doesNotMatch((await result.json()).message, /SQL|credentials/);
  const timeout = await route(async () => { throw new Error('timeout'); })(request());assert.equal(timeout.status, 503);
});
test('invalid requests never call Authentication', async () => {
  const post = route(async () => { throw new Error('must not call'); });
  assert.equal((await post(request({ password: '' }))).status, 400);
  const crossOrigin = request(); crossOrigin.headers.set('origin', 'https://other.example');
  assert.equal((await post(crossOrigin)).status, 403);
});
