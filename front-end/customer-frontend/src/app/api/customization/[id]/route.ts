import { NextRequest, NextResponse } from 'next/server';
import { internalServiceUrl } from '@/lib/internalServiceUrl';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== 'catalog' && !/^[a-f0-9-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }
  const query = id === 'catalog' ? `?page=${encodeURIComponent(req.nextUrl.searchParams.get('page') ?? '0')}` : '';
  try {
    const base = process.env.PRODUCT_SERVICE_URL || internalServiceUrl('http://localhost:8087');
    const response = await fetch(`${base.replace(/\/$/, '')}/product/customization/${id}${query}`, {
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => ({ error: 'Customization is temporarily unavailable' }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Customization is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
