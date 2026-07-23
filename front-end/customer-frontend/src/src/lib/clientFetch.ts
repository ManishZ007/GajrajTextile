'use client';

import { signOut } from 'next-auth/react';

export async function clientFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body?.error === 'SESSION_EXPIRED') {
      await signOut({ callbackUrl: '/login' });
      throw new Error('Session expired');
    }
    throw new Error('Unauthorized');
  }

  return res;
}
