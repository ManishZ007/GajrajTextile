import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

type Ctx = { params: Promise<{ endpoint: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return withApiHandler(async () => {
    const { endpoint } = await params;
    const data = await apiFetch(`http://localhost:8082/customer/${endpoint}`);
    return NextResponse.json(data);
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withApiHandler(async () => {
    const { endpoint } = await params;
    const body = await req.json();
    const data = await apiFetch(`http://localhost:8082/customer/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return withApiHandler(async () => {
    const { endpoint } = await params;
    const body = await req.json();
    const data = await apiFetch(`http://localhost:8082/customer/${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}
