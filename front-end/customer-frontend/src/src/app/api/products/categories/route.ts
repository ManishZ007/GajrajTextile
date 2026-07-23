import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextResponse } from 'next/server';

export async function GET() {
  return withApiHandler(async () => {
    const data = await apiFetch('http://localhost:8087/product/categories');
    return NextResponse.json(data);
  });
}
