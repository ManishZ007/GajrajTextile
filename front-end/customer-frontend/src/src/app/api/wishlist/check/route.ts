import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { extractCustomerId } from '@/lib/jwtUtils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const session = await auth();
    const customerId = extractCustomerId(session?.accessToken as string ?? '');
    if (!customerId) return NextResponse.json({ wishlisted: false, wishlistId: null });

    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ wishlisted: false, wishlistId: null });

    const data = await apiFetch(
      `http://localhost:8087/wishlist/${customerId}/check/${productId}`
    );
    return NextResponse.json(data);
  });
}
