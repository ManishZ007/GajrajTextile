import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (typeof body.phone !== 'string' || body.phone.length > 24) {
      return NextResponse.json({ message: 'Enter a valid Indian mobile number.' }, { status: 400 });
    }
    const response = await fetch(`${process.env.AUTH_SERVICE_URL || 'http://localhost:8081'}/auth/customer/otp/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: body.phone }), cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Mobile login is temporarily unavailable. Please use email login.' }, { status: 503 });
  }
}
