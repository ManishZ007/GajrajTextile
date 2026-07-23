import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return withApiHandler(async () => {
    const { orderId } = await params;
    const data = await apiFetch(`http://localhost:8083/order/${orderId}`);
    console.log('[order detail raw]', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  });
}
