import { NextResponse } from 'next/server';
import { SessionExpiredError } from './api';

export async function withApiHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return NextResponse.json(
        { error: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }
    console.error('[API route error]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
