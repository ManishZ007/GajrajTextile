import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/support — create new support case
export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const body = await req.json();
    const data = await apiFetch('http://localhost:8085/manager/support/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}

// GET /api/support?customerId=xxx&page=0&size=10
export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') ?? '';
    const page = searchParams.get('page') ?? '0';
    const size = searchParams.get('size') ?? '10';
    const data = await apiFetch(
      `http://localhost:8085/manager/support/all?search=${customerId}&page=${page}&size=${size}`
    );
    return NextResponse.json(data);
  });
}
