import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { renderEmail, deliverEmail } from '../src/service/EmailService.js';
import { createEmailHandler } from '../src/consumers/email.consumer.js';
import { createRabbitLifecycle } from '../src/config/rabbitmq.js';
const message = (content = '{}', headers = {}) => ({ content: Buffer.from(content), properties: { headers }, fields: { routingKey: 'email.register' } });
function channel() {
  const calls = [];
  return { calls, ack: () => calls.push('ack'), close: async () => calls.push('close'),
    sendToQueue: (queue, body, options, callback) => { calls.push({queue, options}); callback(); } };
}
test('registration escapes names and supplies missing name', () => {
  assert.match(renderEmail('email.register', { to:'test@example.com', name:'<img>' }).html, /&lt;img&gt;/);
  assert.match(renderEmail('email.register', { to:'test@example.com' }).text, /Namaste there/);
});
test('order message requires reference and renders it safely', () => {
  assert.throws(() => renderEmail('email.orderPlaced', {to:'test@example.com'}));
  assert.match(renderEmail('email.orderPlaced', {to:'test@example.com',orderId:'<123>'}).html, /&lt;123&gt;/);
});
test('SMTP failure propagates', async () => {
  await assert.rejects(deliverEmail('email.register', {to:'test@example.com'}, {sendMail:async()=>{throw Error('offline');}}));
});
test('success acknowledges only after delivery', async () => {
  const c=channel(); await createEmailHandler(c, async()=>c.calls.push('sent'))(message());
  assert.deepEqual(c.calls,['sent','ack']);
});
test('temporary failure persists retry before ack', async () => {
  const c=channel(); await createEmailHandler(c, async()=>{throw Error('offline');})(message());
  assert.equal(c.calls[0].queue,'mail_queue.retry'); assert.equal(c.calls[0].options.headers['x-email-attempts'],1);
  assert.equal(c.calls[1],'ack');
});
test('malformed JSON and exhausted retries go to failed queue', async () => {
  for(const m of [message('{'), message('{}',{'x-email-attempts':3})]) {
    const c=channel(); await createEmailHandler(c, async()=>{throw Error('offline');})(m);
    assert.equal(c.calls[0].queue,'mail_queue.failed'); assert.equal(c.calls[1],'ack');
  }
});
test('unconfirmed retry never acknowledges original', async () => {
  const c=channel(); c.sendToQueue=(_q,_b,_o,callback)=>callback(Error('disconnected'));
  await createEmailHandler(c, async()=>{throw Error('offline');})(message());
  assert.deepEqual(c.calls,['close']);
});
test('reconnect restarts consumer and readiness follows connection', async () => {
  let reconnect, started=0; const connections=[];
  const lifecycle=createRabbitLifecycle({schedule: fn=>{reconnect=fn;return 1;},
    connect:async()=>{ const c=new EventEmitter(); c.close=async()=>{};
      c.createConfirmChannel=async()=>{const ch=new EventEmitter(); ch.assertExchange=async()=>{};return ch;};
      connections.push(c); return c; }, startConsumer:async()=>{started++;} });
  await lifecycle.start(); assert.equal(lifecycle.isReady(),true);
  connections[0].emit('close'); assert.equal(lifecycle.isReady(),false);
  reconnect(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(started,2); assert.equal(lifecycle.isReady(),true); await lifecycle.stop();
});

test('password reset email renders escaped recipient and a single-use link', () => {
  const resetUrl = 'http://localhost:3000/reset-password#token=' + 'a'.repeat(43);
  const result = renderEmail('email.passwordReset', {
    to:'test@example.com', name:'<Customer>', resetUrl, expiresAt:Date.now()+900000,
  });
  assert.match(result.subject,/Reset/);
  assert.match(result.html,/&lt;Customer&gt;/);
  assert.ok(result.html.includes(resetUrl));
  assert.match(result.text,/15 minutes/);
});
test('expired reset emails and unsafe links are rejected', () => {
  const base={to:'test@example.com',expiresAt:Date.now()+900000};
  for (const resetUrl of ['javascript:alert(1)','https://example.com/reset-password#token=bad','http://evil.example/reset-password#token='+'a'.repeat(43)]) {
    assert.throws(()=>renderEmail('email.passwordReset',{...base,resetUrl}));
  }
  assert.throws(()=>renderEmail('email.passwordReset',{...base,
    resetUrl:'http://localhost:3000/reset-password#token='+'a'.repeat(43),expiresAt:Date.now()-1}));
});
test('reset emails do not retain credentials in failed queues', async () => {
  const m=message('{}',{'x-email-route':'email.passwordReset','x-email-attempts':3});
  const c=channel();
  await createEmailHandler(c,async()=>{throw Error('offline');})(m);
  assert.deepEqual(c.calls,['ack']);
});
