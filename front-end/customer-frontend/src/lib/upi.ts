export function upiPayload(orderId: string, amount: number, email: string, contact: string, qr: boolean, expiresAt: string | null, now = Date.now()) {
  const remainingMinutes = expiresAt ? Math.floor((Date.parse(expiresAt) - now) / 60000) : 10;
  if (!Number.isFinite(remainingMinutes) || remainingMinutes < 1) {
    throw new Error('The payment reservation is expiring. Check payment status before retrying.');
  }
  return {
    order_id: orderId, amount, currency: 'INR', method: 'upi', email, contact,
    ...(qr ? { upi: { qr: true, timeout: Math.min(10, remainingMinutes) } } : {}),
  };
}

const APP_NAMES: Record<string, string> = {
  gpay: 'Google Pay', phonepe: 'PhonePe', paytm: 'Paytm', cred: 'CRED', bhim: 'BHIM',
  mobikwik: 'MobiKwik', navi: 'Navi', payzapp: 'PayZapp', icici: 'iMobile',
  popclubapp: 'POP', super_money: 'super.money', moneyview: 'Moneyview', any: 'Other UPI apps',
};

export function supportedUpiApps(response: unknown): { code: string; name: string }[] {
  const codes = Array.isArray(response)
    ? response.filter((code): code is string => typeof code === 'string')
    : response && typeof response === 'object'
      ? Object.entries(response).filter(([, enabled]) => !!enabled).map(([code]) => code)
      : [];
  return [...new Set(codes)].filter((code) => APP_NAMES[code]).map((code) => ({ code, name: APP_NAMES[code] }));
}
