import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enabledBanks, loadBanks, netbankingPayload, netbankingError } from '../src/lib/netbanking.ts';

test('only gateway-enabled banks are offered, preserving bank codes', () => {
  assert.deepEqual(enabledBanks({ methods: { netbanking: { YESB: 'Yes Bank', HDFC: 'HDFC Bank', DISABLED: false } } }), [
    { code: 'HDFC', name: 'HDFC Bank' }, { code: 'YESB', name: 'Yes Bank' },
  ]);
  assert.deepEqual(enabledBanks({ methods: { netbanking: false } }), []);
});

test('ready event supplies account-specific banks', async () => {
  const banks = await loadBanks({ once(event, callback) {
    assert.equal(event, 'ready');
    callback({ methods: { netbanking: { YESB: 'Yes Bank' } } });
  } });
  assert.equal(banks[0].code, 'YESB');
});

test('unavailable netbanking is rejected rather than offering hardcoded banks', async () => {
  await assert.rejects(loadBanks({ once(_, callback) { callback({ methods: {} }); } }), /not available/);
});

test('netbanking submits full gateway payload with paise amount unchanged', () => {
  assert.deepEqual(netbankingPayload('order_test', 1800000, 'YESB', ' user@example.com ', ' 9999999999 '), {
    order_id: 'order_test', amount: 1800000, currency: 'INR', method: 'netbanking', bank: 'YESB',
    email: 'user@example.com', contact: '9999999999',
  });
});

test('missing customer details are rejected before payment submission', () => {
  assert.throws(() => netbankingPayload('order_test', 100, 'YESB', '', '9999999999'), /email and phone/);
  assert.throws(() => netbankingPayload('order_test', 100, 'YESB', 'user@example.com', ''), /email and phone/);
  assert.throws(() => netbankingPayload('order_test', 100, '', 'user@example.com', '9999999999'), /available bank/);
});

test('gateway error is shown, with a safe fallback for malformed events', () => {
  assert.equal(netbankingError({ error: { description: 'Bank unavailable' } }), 'Bank unavailable');
  assert.equal(netbankingError(null), 'The bank payment did not complete.');
});
