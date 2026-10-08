import type { JWT } from 'next-auth/jwt';

export async function enrichCustomerSession(
  token: JWT,
  baseUrl: string,
  fetchProfile: typeof fetch = fetch,
): Promise<JWT> {
  if (!token.accessToken || !token.sub || (token.name && token.email)) return token;
  if (Number(token.profileLookupAfter || 0) > Date.now()) return token;
  const next = { ...token, profileLookupAfter: Date.now() + 30000 };
  try {
    // Use the authenticated server identity, never browser-provided profile claims.
    const response = await fetchProfile(`${baseUrl}/auth/admin/me`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return next;
    const profile = (await response.json()).auth;
    if (!profile || profile.userId !== token.sub) return next;
    return {
      ...next,
      name: typeof profile.fullName === 'string' && profile.fullName.trim() ? profile.fullName.trim() : token.name,
      email: typeof profile.email === 'string' && profile.email.trim() ? profile.email.trim() : token.email,
    };
  } catch {
    // Profile lookup failures must not invalidate an otherwise successful login.
    return next;
  }
}
