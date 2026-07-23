import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { extractCustomerId } from '@/lib/jwtUtils';
import { NextResponse } from 'next/server';

export async function GET() {
  return withApiHandler(async () => {
    const session = await auth();
    const customerId = extractCustomerId(session?.accessToken as string ?? '');
    if (!customerId) return NextResponse.json([], { status: 403 });

    const data = await apiFetch(`http://localhost:8087/wishlist/${customerId}`);
    return NextResponse.json(data);
  });
}
