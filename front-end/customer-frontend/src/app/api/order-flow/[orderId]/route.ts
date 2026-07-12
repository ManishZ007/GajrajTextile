import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/order-flow/:orderId
// Proxies to http://localhost:8085/manager/order-flow/{orderId}
// /manager/** is permitAll in the manager Security config — no manager JWT needed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return withApiHandler(async () => {
    const { orderId } = await params;
    const data = await apiFetch(
      `http://localhost:8085/manager/order-flow/${orderId}`
    );
    return NextResponse.json(data);
  });
}
