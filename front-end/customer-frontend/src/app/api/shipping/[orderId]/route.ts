import { internalServiceUrl } from '@/lib/internalServiceUrl';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenExpired') return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
  const { orderId } = await params;
  try {
    const response = await fetch(internalServiceUrl(`http://localhost:8089/shipping/order/${encodeURIComponent(orderId)}/timeline`), {
      headers: { Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store',
    });
    if (response.status === 204) return NextResponse.json(null);
    if (!response.ok) return NextResponse.json({ error: 'Shipping information unavailable' }, { status: response.status });
    return NextResponse.json(await response.json());
  } catch { return NextResponse.json({ error: 'Shipping Service unavailable' }, { status: 503 }); }
}
