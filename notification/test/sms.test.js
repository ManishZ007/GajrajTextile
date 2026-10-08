import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createCipheriv } from 'node:crypto';
import { decryptLoginOtp } from '../src/service/SmsPayload.js';
import { createSmsSender, PermanentSmsError } from '../src/service/SmsService.js';
import { createSmsHandler } from '../src/consumers/sms.consumer.js';

const now = Date.now();
const data = { to: '+919876543210', code: '012345', expiresAt: now + 120000, purpose: 'CUSTOMER_LOGIN' };
const key = randomBytes(32);
function envelope(payload = data) {
  const id = randomUUID(), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(id));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final(), cipher.getAuthTag()]);
  return { eventId: id, iv: iv.toString('base64'), ciphertext: encrypted.toString('base64') };
}
const env = { SMS_PROVIDER: 'zunoy-sandbox', ZUNOY_SMS_API_KEY: 'test-key', ZUNOY_SMS_SENDER_ID: '12345' };
test('encrypted SMS round-trips; tampering and expiry are rejected', () => {
  const e = envelope(); assert.deepEqual(decryptLoginOtp(e, key.toString('base64'), now), data);
  assert.throws(() => decryptLoginOtp({...e, eventId: randomUUID()}, key.toString('base64'), now));
  assert.throws(() => decryptLoginOtp(envelope({...data, expiresAt: now-1}), key.toString('base64'), now));
  assert.throws(() => decryptLoginOtp(e, randomBytes(32).toString('base64'), now));
});
test('Zunoy adapter uses dashboard format and raw Authorization', async () => {
  let request;
  const send = createSmsSender({env, now:()=>now, fetchImpl: async (...args)=> {request=args; return {ok:true};}});
  await send(data);
  assert.equal(request[0], 'https://mock-sms.zunoy.com/sms/new/message');
  assert.equal(request[1].headers.Authorization, 'test-key');
  const body=JSON.parse(request[1].body);
  assert.equal(body.senderId,12345); assert.match(body.message,/012345/); assert.match(body.message,/\+919876543210/);
  assert.deepEqual(Object.keys(body).sort(), ['message','senderId']);
});
test('missing config, expired codes, production and foreign endpoints never send', async () => {
  let sends=0;
  for (const setting of [{...env,ZUNOY_SMS_SENDER_ID:''},{...env,NODE_ENV:'production'},{...env,ZUNOY_SMS_URL:'https://example.com/sms'}]) {
    await assert.rejects(createSmsSender({env:setting,now:()=>now,fetchImpl:async()=>{sends++;}})(data), PermanentSmsError);
  }
  await assert.rejects(createSmsSender({env,now:()=>now,fetchImpl:async()=>{sends++;}})({...data,expiresAt:now-1}),PermanentSmsError);
  assert.equal(sends,0);
});
test('provider rejects invalid key permanently and retries temporary failures', async () => {
  await assert.rejects(createSmsSender({env,now:()=>now,fetchImpl:async()=>({ok:false,status:401})})(data),PermanentSmsError);
  await assert.rejects(createSmsSender({env,now:()=>now,fetchImpl:async()=>({ok:false,status:503})})(data),e=>!(e instanceof PermanentSmsError));
});
function channel() {
  const calls=[];
  return {calls,ack:()=>calls.push('ack'),close:async()=>calls.push('close'),sendToQueue:(q,b,o,cb)=>{calls.push({q,b,o});cb();}};
}
function message(attempts=0) {
  return {content:Buffer.from(JSON.stringify(envelope())),properties:{headers:{'x-sms-attempts':attempts}},fields:{routingKey:'sms.loginOtp'}};
}
const decode = e=>decryptLoginOtp(e,key.toString('base64'),now);
test('OTP acknowledged only after provider accepts',async()=>{
  const c=channel();await createSmsHandler(c,{decode,send:async()=>{c.calls.push('sent');},now:()=>now})(message());
  assert.deepEqual(c.calls,['sent','ack']);
});
test('temporary failure confirms encrypted retry with remaining lifetime before ack',async()=>{
  const c=channel(),m=message();await createSmsHandler(c,{decode,send:async()=>{throw Error();},now:()=>now})(m);
  assert.equal(c.calls[0].q,'sms_queue.retry');assert.deepEqual(c.calls[0].b,m.content);
  assert.equal(c.calls[0].o.expiration,'120000');assert.equal(c.calls[1],'ack');
});
test('invalid, exhausted, and permanent failures are discarded without OTP archives',async()=>{
  for(const [m,send] of [[message(2),async()=>{throw Error();}],[message(),async()=>{throw new PermanentSmsError();}],[{...message(),content:Buffer.from('{')},async()=>{throw Error('must not send');}]]) {
    const c=channel();await createSmsHandler(c,{decode,send,now:()=>now})(m);assert.deepEqual(c.calls,['ack']);
  }
});
test('retry publication failure never acknowledges original',async()=>{
  const c=channel();c.sendToQueue=(_q,_b,_o,cb)=>cb(Error());
  await createSmsHandler(c,{decode,send:async()=>{throw Error();},now:()=>now})(message());assert.deepEqual(c.calls,['close']);
});
