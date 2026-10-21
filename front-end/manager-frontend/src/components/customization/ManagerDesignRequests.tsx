'use client';
import { apiFetch } from '@/lib/api/apiFetch';
import DesignRequestsView from './DesignRequestsView';
async function request(path: string, quote?: { amount: number; notes: string; version: number }) {
  return apiFetch('http://localhost:8087/product/design-requests' + path, {
    method: quote ? 'PUT' : 'GET', cache: 'no-store',
    body: quote ? JSON.stringify(quote) : undefined,
  });
}
export default function ManagerDesignRequests({ id }: { id?: string }) {
  return <DesignRequestsView id={id} staff request={request} />;
}
