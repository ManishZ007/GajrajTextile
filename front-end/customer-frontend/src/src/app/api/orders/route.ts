import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') ?? '0';
    const size = searchParams.get('size') ?? '10';
    const data = await apiFetch(
      `http://localhost:8083/order/my-orders?page=${page}&size=${size}`
    );
    return NextResponse.json(data);
  });
}
