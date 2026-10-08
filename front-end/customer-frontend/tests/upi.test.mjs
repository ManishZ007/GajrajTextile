import { test } from 'node:test';
import assert from 'node:assert/strict';
import { upiPayload, supportedUpiApps } from '../src/lib/upi.ts';

const now = Date.parse('2026-09-29T00:00:00Z');

test('QR binds payment to the existing order and server amount', () => {
  assert.deepEqual(upiPayload('order_test', 1800000, 'test@example.com', '9999999999', true, '2026-09-29T00:15:00Z', now), {
    order_id: 'order_test', amount: 1800000, currency: 'INR', method: 'upi',
    email: 'test@example.com', contact: '9999999999', upi: { qr: true, timeout: 10 },
  });
});

test('QR duration does not extend beyond the remaining stock reservation', () => {
  assert.equal(upiPayload('order_test', 100, '', '', true, '2026-09-29T00:03:45Z', now).upi.timeout, 3);
});

test('expired or nearly expired reservations cannot initiate payment', () => {
  for (const expiry of ['2026-09-29T00:00:00Z', '2026-09-29T00:00:59Z', 'invalid']) {
    assert.throws(() => upiPayload('order_test', 100, '', '', true, expiry, now), /expiring/);
  }
});

test('intent payload does not request collect or QR', () => {
  const data = upiPayload('order_test', 100, '', '', false, '2026-09-29T00:15:00Z', now);
  assert.equal(data.method, 'upi');
  assert.equal('upi' in data, false);
  assert.equal('vpa' in data, false);
});

test('mobile app choices are restricted to supported SDK results', () => {
  assert.deepEqual(supportedUpiApps(['gpay', 'phonepe', 'gpay', 'unknown']), [
    { code: 'gpay', name: 'Google Pay' }, { code: 'phonepe', name: 'PhonePe' },
  ]);
  assert.deepEqual(supportedUpiApps([]), []);
  assert.deepEqual(supportedUpiApps(null), []);
});
