import { auth } from '@/auth';

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const session = await auth();

  if (session?.error === 'RefreshTokenExpired') {
    throw new SessionExpiredError();
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.accessToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  return res.json();
}
