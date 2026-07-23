import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const categoryId = req.nextUrl.searchParams.get('categoryId');
    if (!categoryId) return NextResponse.json([]);

    const data = await apiFetch(
      `http://localhost:8087/product/all?categoryId=${categoryId}`
    );
    return NextResponse.json(data);
  });
}
