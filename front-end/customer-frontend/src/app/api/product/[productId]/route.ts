import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  return withApiHandler(async () => {
    const { productId } = await params;
    const data = await apiFetch(`http://localhost:8087/product/${productId}`);
    return NextResponse.json(data);
  });
}
