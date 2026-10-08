import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const headers = { 'Cache-Control': 'no-store' };
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403, headers });
  const { action } = await context.params;
  if (!['request', 'validate', 'reset'].includes(action))
    return NextResponse.json({ message: 'Not found.' }, { status: 404, headers });
  let body;
  try {
    body = await request.json();
    if (!body || typeof body !== 'object') throw new Error();
    if (action === 'request' && (typeof body.email !== 'string' || body.email.length > 150)) throw new Error();
    if (action !== 'request' && (typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token))) throw new Error();
    if (action === 'reset' && (typeof body.password !== 'string' || body.password.length > 72)) throw new Error();
  } catch {
    return NextResponse.json({ message: 'Invalid request. Check your details or request a new link.' }, { status: 400, headers });
  }
  try {
    const payload = action === 'request' ? { email: body.email }
      : action === 'validate' ? { token: body.token } : { token: body.token, password: body.password };
    const response = await fetch(`${process.env.AUTH_SERVICE_URL || 'http://localhost:8081'}/auth/customer/password-reset/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers });
  } catch {
    return NextResponse.json({ message: 'Password reset is temporarily unavailable. Please try again shortly.' }, { status: 503, headers });
  }
}
