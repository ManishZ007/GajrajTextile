import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return withApiHandler(async () => {
    const data = await apiFetch('http://localhost:8082/customer/address');
    return NextResponse.json(data);
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const body = await req.json();
    const data = await apiFetch('http://localhost:8082/customer/address', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}
