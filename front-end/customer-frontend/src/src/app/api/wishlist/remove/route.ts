import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { extractCustomerId } from '@/lib/jwtUtils';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  return withApiHandler(async () => {
    const session = await auth();
    const customerId = extractCustomerId(session?.accessToken as string ?? '');
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const wishlistId = req.nextUrl.searchParams.get('wishlistId');
    const productId  = req.nextUrl.searchParams.get('productId');

    if (wishlistId) {
      const data = await apiFetch(
        `http://localhost:8087/wishlist/remove/${wishlistId}`,
        { method: 'DELETE' }
      );
      return NextResponse.json(data);
    }

    if (productId) {
      const data = await apiFetch(
        `http://localhost:8087/wishlist/remove?customerId=${customerId}&productId=${productId}`,
        { method: 'DELETE' }
      );
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'wishlistId or productId required' }, { status: 400 });
  });
}
