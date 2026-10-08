export interface NetbankingClient {
  once: (event: string, callback: (data: unknown) => void) => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  createPayment: (data: Record<string, unknown>) => void;
}

export function enabledBanks(response: unknown): { code: string; name: string }[] {
  const banks = (response as { methods?: { netbanking?: unknown } })?.methods?.netbanking;
  if (!banks || typeof banks !== 'object' || Array.isArray(banks)) return [];
  return Object.entries(banks)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && !!entry[1])
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadBanks(client: NetbankingClient): Promise<{ code: string; name: string }[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Banks could not be loaded. Please try again.')), 15000);
    client.once('ready', (response) => {
      clearTimeout(timeout);
      const banks = enabledBanks(response);
      if (!banks.length) reject(new Error('Netbanking is not available for this account. Please choose another payment method.'));
      else resolve(banks);
    });
  });
}

export function netbankingPayload(orderId: string, amount: number, bank: string, email: string, contact: string) {
  if (!email.trim() || !contact.trim()) throw new Error('Add your email and phone number to your profile before paying.');
  if (!bank) throw new Error('Select an available bank.');
  return { order_id: orderId, amount, currency: 'INR', method: 'netbanking', bank, email: email.trim(), contact: contact.trim() };
}

export function netbankingError(response: unknown): string {
  const description = (response as { error?: { description?: unknown } })?.error?.description;
  return typeof description === 'string' && description ? description : 'The bank payment did not complete.';
}
