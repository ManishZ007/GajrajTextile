import { internalServiceUrl } from '@/lib/internalServiceUrl';

export async function POST(request: Request) {
  const json = (message: string, status: number) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.headers.get('origin') !== new URL(request.url).origin) return json('Invalid request origin', 403);
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 8192) return json('Registration request is too large', 413);
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json('Invalid registration details', 400);
  } catch { return json('Invalid registration details', 400); }
  const { fullName, email, phoneNumber, password } = body;
  if (![fullName, email, phoneNumber, password].every(value => typeof value === 'string' && value.trim()))
    return json('Full name, email, phone number and password are required', 400);
  try {
    const base = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
    const upstream = await fetch(internalServiceUrl(`${base.replace(/\/$/, '')}/auth/register`), {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
      // Never forward a caller-supplied role or authorization header.
      body: JSON.stringify({ fullName, email, phoneNumber, passwordHash: password, role: 'CUSTOMER' }),
    });
    if (upstream.ok) return json('Account created successfully', 201);
    if (upstream.status >= 500) return json('Registration is temporarily unavailable. Please try again shortly.', 503);
    const text = await upstream.text();
    let message = 'Registration failed. Please check your details.';
    try {
      const error = JSON.parse(text);
      if (typeof error.message === 'string') message = error.message;
      else if (typeof error.error === 'string') message = error.error;
    } catch {
      // Compatibility with older Authentication deployments returning plain text.
      if (text.trim() && text.length <= 500 && !text.trim().startsWith('<')) message = text.trim();
    }
    return json(message, upstream.status);
  } catch { return json('Registration is temporarily unavailable. Please try again shortly.', 503); }
}
