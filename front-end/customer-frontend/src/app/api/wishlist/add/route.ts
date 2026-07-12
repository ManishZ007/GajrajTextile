import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { extractCustomerId } from '@/lib/jwtUtils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const session = await auth();
    const customerId = extractCustomerId(session?.accessToken as string ?? '');
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { productId } = await req.json();
    const data = await apiFetch('http://localhost:8087/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ customerId, productId }),
    });
    return NextResponse.json(data);
  });
}
