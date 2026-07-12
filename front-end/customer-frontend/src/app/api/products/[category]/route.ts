import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  return withApiHandler(async () => {
    const { category } = await params;
    const data = await apiFetch(
      `http://localhost:8082/product/category/${category}`
    );
    return NextResponse.json(data);
  });
}
