import { cookies, headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';

// Only the authenticated server proxy may supply a limiter identity to Authentication.
export async function authClientHeaders(): Promise<Record<string, string>> {
  const secret = process.env.AUTH_PROXY_TOKEN;
  if (!secret) return {};
  const incoming = await headers();
  // Enable only behind an ingress that replaces, rather than preserves, client headers.
  const ip = incoming.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (process.env.AUTH_TRUST_PROXY_HEADERS === 'true' && ip && isIP(ip)) {
    return { 'X-Auth-Proxy-Token': secret, 'X-Auth-Client': `ip:${ip}` };
  }
  const jar = await cookies();
  let id = jar.get('auth-client-id')?.value;
  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    id = randomUUID();
    jar.set('auth-client-id', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 86400 });
  }
  // Local development has no trusted ingress. Per-account/phone quotas remain mandatory.
  return { 'X-Auth-Proxy-Token': secret, 'X-Auth-Client': `browser:${id}` };
}
